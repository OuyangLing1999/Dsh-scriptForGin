#!/usr/bin/env python3
"""Explicit FFmpeg fallback for targeted video evidence extraction."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import shutil
import subprocess


KNOWN_VIDEO_CONTAINERS = {".mov", ".mp4", ".mkv", ".webm", ".avi", ".m4v"}


def probe_command(source: Path) -> list[str]:
    return [
        shutil.which("ffprobe") or "ffprobe",
        "-v",
        "error",
        "-show_entries",
        "format=duration,size,bit_rate:stream=index,codec_type,codec_name,width,height,sample_rate,channels",
        "-of",
        "json",
        str(source),
    ]


def probe_media(source: Path) -> dict:
    result = subprocess.run(
        probe_command(source),
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(result.stdout)


def build_commands(
    source: Path,
    output_dir: Path,
    *,
    clip_start: str | None = None,
    clip_end: str | None = None,
    frame_times: tuple[str, ...] = (),
) -> list[list[str]]:
    ffmpeg = shutil.which("ffmpeg") or "ffmpeg"
    commands: list[list[str]] = []

    if bool(clip_start) != bool(clip_end):
        raise ValueError("clip_start and clip_end must be provided together")
    if clip_start and clip_end:
        source_suffix = source.suffix.lower()
        clip_suffix = source_suffix if source_suffix in KNOWN_VIDEO_CONTAINERS else ".mkv"
        commands.append(
            [
                ffmpeg,
                "-y",
                "-hide_banner",
                "-loglevel",
                "error",
                "-ss",
                clip_start,
                "-to",
                clip_end,
                "-i",
                str(source),
                "-c",
                "copy",
                str(output_dir / f"clip{clip_suffix}"),
            ]
        )

    for index, timestamp in enumerate(frame_times, start=1):
        commands.append(
            [
                ffmpeg,
                "-y",
                "-hide_banner",
                "-loglevel",
                "error",
                "-ss",
                timestamp,
                "-i",
                str(source),
                "-frames:v",
                "1",
                str(output_dir / f"frame_{index:03d}.jpg"),
            ]
        )
    return commands


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--clip-start")
    parser.add_argument("--clip-end")
    parser.add_argument("--frame-at", action="append", default=[])
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if not args.source.is_file():
        parser.error(f"source does not exist: {args.source}")

    try:
        commands = build_commands(
            args.source,
            args.output_dir,
            clip_start=args.clip_start,
            clip_end=args.clip_end,
            frame_times=tuple(args.frame_at),
        )
    except ValueError as error:
        parser.error(str(error))

    if args.dry_run:
        print(json.dumps({"dry_run": True, "commands": commands}, ensure_ascii=False))
        return 0

    args.output_dir.mkdir(parents=True, exist_ok=True)
    metadata = probe_media(args.source)
    (args.output_dir / "metadata.json").write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    for command in commands:
        subprocess.run(command, check=True)
    print(json.dumps({"metadata": metadata, "outputs": [c[-1] for c in commands]}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
