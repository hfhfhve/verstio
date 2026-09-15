#!/usr/bin/env python3
"""Собирает BUNDLE.txt — один текстовый снимок всего репозитория.

Запуск: python3 build_bundle.py
Результат: BUNDLE.txt в корне репозитория.

Формат тот же, что у бэкенда: шапка с коммитом и датой, список файлов
с числом строк, потом сами файлы под разделителями.
"""

from __future__ import annotations

import datetime as dt
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "BUNDLE.txt"
TITLE = "Verstio Frontend — снимок репозитория"
RULE = "\u2550" * 56

#: Какие расширения кладём в бандл. Картинки и шрифты смысла не имеют.
KEEP_SUFFIX = {
    ".html", ".css", ".js", ".mjs", ".json", ".md", ".txt", ".yml", ".yaml",
    ".py", ".sh", ".svg", ".toml", ".ini", ".cfg",
}
#: Файлы без расширения, которые всё равно нужны.
KEEP_NAME = {"CNAME", "Dockerfile", ".gitignore", ".nojekyll"}
#: Папки, которые не обходим.
SKIP_DIR = {".git", "node_modules", ".github", "dist", "build", "__pycache__"}
#: Сам бандл и скрипт сборки в себя не кладём — иначе бандл растёт вдвое.
SKIP_NAME = {"BUNDLE.txt", "build_bundle.py"}
#: Слишком большие файлы только упоминаем, без содержимого.
MAX_BYTES = 2 * 1024 * 1024


def git(*args: str) -> str:
    try:
        return subprocess.run(
            ["git", *args], cwd=ROOT, capture_output=True, text=True, check=True
        ).stdout.strip()
    except Exception:
        return ""


def collect() -> list[Path]:
    found: list[Path] = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = sorted(d for d in dirnames if d not in SKIP_DIR)
        for name in sorted(filenames):
            if name in SKIP_NAME:
                continue
            p = Path(dirpath) / name
            if name in KEEP_NAME or p.suffix.lower() in KEEP_SUFFIX:
                found.append(p)
    return found


def main() -> int:
    files = collect()
    if not files:
        print("Нечего собирать: подходящих файлов не найдено.", file=sys.stderr)
        return 1

    built = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    commit = git("rev-parse", "HEAD") or "(вне git)"

    bodies: dict[Path, str] = {}
    lines_out: list[str] = [
        f"# {TITLE}",
        f"# commit: {commit}",
        f"# built:  {built}",
        "",
        "## Состав",
    ]

    for p in files:
        rel = p.relative_to(ROOT).as_posix()
        size = p.stat().st_size
        if size > MAX_BYTES:
            bodies[p] = f"[пропущено: {size // 1024} КБ, больше лимита]"
            lines_out.append(f"{rel}  ({size // 1024} КБ, пропущен)")
            continue
        try:
            text = p.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            bodies[p] = "[пропущено: не текст UTF-8]"
            lines_out.append(f"{rel}  (не текст, пропущен)")
            continue
        bodies[p] = text
        lines_out.append(f"{rel}  ({text.count(chr(10)) + 1} строк)")

    for p in files:
        rel = p.relative_to(ROOT).as_posix()
        lines_out += ["", RULE, f"  {rel}", RULE, "", bodies[p].rstrip("\n")]

    OUT.write_text("\n".join(lines_out) + "\n", encoding="utf-8")
    kb = OUT.stat().st_size // 1024
    print(f"BUNDLE.txt готов: {len(files)} файлов, {kb} КБ")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
