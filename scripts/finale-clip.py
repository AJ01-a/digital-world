#!/usr/bin/env python3
"""
Cuts the ending's clip out of the original video in ./Videos — losslessly.

    python3 scripts/finale-clip.py

The site's closing sequence only uses a few seconds of a 48-second effects
pack. Rather than publish (and make visitors download) the whole 14 MB file,
this copies just that stretch into public/finale/glass-break.mp4: the same
compressed H.264 frames, byte for byte, in a new MP4 with rebuilt sample
tables. Nothing is re-encoded, so there is no quality loss, and no ffmpeg is
needed — only the Python standard library.

The cut snaps outward to keyframes (it has to start on one to be playable)
and the result is video only: the ending always plays muted. ./Videos is read,
never modified.

The poster stills (public/finale/glass-hole-*.avif|webp) are a frame from
this clip at ~1.6s (23.6s in the original), saved from the browser.
"""
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "Videos"
OUT = ROOT / "public" / "finale" / "glass-break.mp4"

# The stretch the ending uses, in seconds of the original: from black, a pane
# shatters, holds open, then bursts outward past the camera.
START, END = 22.0, 25.5


# ── reading ──────────────────────────────────────────────────

def boxes(buf, off=0, end=None):
    """Yield (type, payload_start, box_end) for the boxes in buf[off:end]."""
    end = len(buf) if end is None else end
    while off + 8 <= end:
        size, typ = struct.unpack(">I4s", buf[off:off + 8])
        hdr = 8
        if size == 1:
            size = struct.unpack(">Q", buf[off + 8:off + 16])[0]
            hdr = 16
        elif size == 0:
            size = end - off
        yield typ, off + hdr, off + size
        off += size


def child(buf, start, end, *path):
    """Find a nested box by path, e.g. child(buf, s, e, b'mdia', b'minf')."""
    for typ, s, e in boxes(buf, start, end):
        if typ == path[0]:
            return (s, e) if len(path) == 1 else child(buf, s, e, *path[1:])
    return None


def table(buf, s, fmt, header=8):
    """A full box's entry table: version/flags, entry count, then entries."""
    n = struct.unpack(">I", buf[s + header - 4:s + header])[0]
    size = struct.calcsize(fmt)
    return [struct.unpack(fmt, buf[s + header + i * size:s + header + (i + 1) * size]) for i in range(n)]


# ── writing ──────────────────────────────────────────────────

def box(typ, *payload):
    data = b"".join(payload)
    return struct.pack(">I4s", 8 + len(data), typ) + data


def full(typ, *payload, version=0, flags=0):
    return box(typ, struct.pack(">I", (version << 24) | flags), *payload)


def rle(values):
    out = []
    for v in values:
        if out and out[-1][1] == v:
            out[-1][0] += 1
        else:
            out.append([1, v])
    return out


def main() -> None:
    sources = sorted(p for p in SRC_DIR.iterdir() if p.suffix.lower() == ".mp4")
    if len(sources) != 1:
        raise SystemExit(f"expected exactly one .mp4 in {SRC_DIR}, found {len(sources)}")
    src = sources[0]
    buf = src.read_bytes()

    moov = child(buf, 0, None, b"moov")
    mvhd = child(buf, *moov, b"mvhd")
    if buf[mvhd[0]] != 0:
        raise SystemExit("unsupported: version 1 mvhd")
    movie_scale = struct.unpack(">I", buf[mvhd[0] + 12:mvhd[0] + 16])[0]

    # The video track.
    trak = None
    for typ, s, e in boxes(buf, *moov):
        if typ == b"trak":
            h = child(buf, s, e, b"mdia", b"hdlr")
            if buf[h[0] + 8:h[0] + 12] == b"vide":
                trak = (s, e)
    if not trak:
        raise SystemExit("no video track")
    mdhd = child(buf, *trak, b"mdia", b"mdhd")
    if buf[mdhd[0]] != 0:
        raise SystemExit("unsupported: version 1 mdhd")
    scale = struct.unpack(">I", buf[mdhd[0] + 12:mdhd[0] + 16])[0]
    stbl = child(buf, *trak, b"mdia", b"minf", b"stbl")
    get = lambda name: child(buf, *stbl, name)

    # Per-sample decode times, sizes, composition offsets and file offsets.
    deltas = [d for n, d in table(buf, get(b"stts")[0], ">II") for _ in range(n)]
    stsz = get(b"stsz")[0]
    fixed, count = struct.unpack(">II", buf[stsz + 4:stsz + 12])
    sizes = [fixed] * count if fixed else list(struct.unpack(f">{count}I", buf[stsz + 12:stsz + 12 + 4 * count]))
    ctts_box = get(b"ctts")
    ctts_version = buf[ctts_box[0]] if ctts_box else 0
    offsets_c = [o for n, o in table(buf, ctts_box[0], ">I" + ("i" if ctts_version else "I"))
                 for _ in range(n)] if ctts_box else [0] * count
    sync = {k - 1 for (k,) in table(buf, get(b"stss")[0], ">I")} if get(b"stss") else set(range(count))
    co = get(b"stco")
    chunks = [c for (c,) in table(buf, co[0], ">I")] if co else [c for (c,) in table(buf, get(b"co64")[0], ">Q")]
    stsc = table(buf, get(b"stsc")[0], ">III")
    file_pos, i = [], 0
    for ci, base in enumerate(chunks, start=1):
        per = next(spc for first, spc, _ in reversed(stsc) if first <= ci)
        for _ in range(per):
            file_pos.append(base)
            base += sizes[i]
            i += 1
    assert i == count, "sample tables disagree"

    dts = [0]
    for d in deltas[:-1]:
        dts.append(dts[-1] + d)

    # Snap outward to keyframes: start on the last one at or before START,
    # stop just before the first one after END.
    first = max(k for k in sync if dts[k] <= START * scale)
    later = [k for k in sync if dts[k] > END * scale]
    last = (min(later) if later else count) - 1
    keep = range(first, last + 1)
    n = len(keep)
    duration = sum(deltas[k] for k in keep)
    movie_duration = round(duration * movie_scale / scale)

    # The kept frames, back to back.
    mdat_data = b"".join(buf[file_pos[k]:file_pos[k] + sizes[k]] for k in keep)

    # Edit list: same presentation delay as the original (B-frame offset).
    elst_box = child(buf, *trak, b"edts", b"elst")
    media_time = 0
    if elst_box and buf[elst_box[0]] == 0:
        entries = table(buf, elst_box[0], ">IiHH")
        media_time = next((mt for _, mt, _, _ in entries if mt >= 0), 0)

    def stbl_box(chunk_offset):
        return box(
            b"stbl",
            buf[get(b"stsd")[0] - 8:get(b"stsd")[1]],
            full(b"stts", struct.pack(">I", len(rle([deltas[k] for k in keep]))),
                 *(struct.pack(">II", c, v) for c, v in rle([deltas[k] for k in keep]))),
            full(b"ctts", struct.pack(">I", len(rle([offsets_c[k] for k in keep]))),
                 *(struct.pack(">I" + ("i" if ctts_version else "I"), c, v) for c, v in rle([offsets_c[k] for k in keep])),
                 version=ctts_version),
            full(b"stss", struct.pack(">I", len([k for k in keep if k in sync])),
                 *(struct.pack(">I", k - first + 1) for k in keep if k in sync)),
            full(b"stsc", struct.pack(">IIII", 1, 1, n, 1)),
            full(b"stsz", struct.pack(">II", 0, n), *(struct.pack(">I", sizes[k]) for k in keep)),
            full(b"stco", struct.pack(">II", 1, chunk_offset)),
        )

    def patched(region, at, value):
        """Copy a box with a 32-bit field replaced."""
        s, e = region
        raw = bytearray(buf[s - 8:e])
        raw[8 + at:8 + at + 4] = struct.pack(">I", value)
        return bytes(raw)

    def moov_box(chunk_offset):
        minf = child(buf, *trak, b"mdia", b"minf")
        vmhd = child(buf, *minf, b"vmhd")
        dinf = child(buf, *minf, b"dinf")
        mdia = child(buf, *trak, b"mdia")
        hdlr = child(buf, *mdia, b"hdlr")
        tkhd = child(buf, *trak, b"tkhd")
        return box(
            b"moov",
            patched(mvhd, 16, movie_duration),
            box(
                b"trak",
                patched(tkhd, 20, movie_duration),
                box(b"edts", full(b"elst", struct.pack(">IIiHH", 1, movie_duration, media_time, 1, 0))),
                box(
                    b"mdia",
                    patched(mdhd, 16, duration),
                    buf[hdlr[0] - 8:hdlr[1]],
                    box(b"minf", buf[vmhd[0] - 8:vmhd[1]], buf[dinf[0] - 8:dinf[1]], stbl_box(chunk_offset)),
                ),
            ),
        )

    ftyp = child(buf, 0, None, b"ftyp")
    head = buf[ftyp[0] - 8:ftyp[1]]
    # moov first (fast start), then mdat — the chunk offset depends on moov's size.
    size = len(moov_box(0))
    out = head + moov_box(len(head) + size + 8) + box(b"mdat", mdat_data)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_bytes(out)
    t = lambda k: dts[k] / scale
    print(f"{src.name}: frames {first + 1}–{last + 1} ({t(first):.3f}s → {t(last) + deltas[last] / scale:.3f}s), "
          f"{n} frames, {duration / scale:.3f}s")
    print(f"wrote {OUT.relative_to(ROOT)} — {len(out) / 1e6:.2f} MB (from {len(buf) / 1e6:.2f} MB)")


if __name__ == "__main__":
    main()
