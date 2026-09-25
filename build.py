#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Сборка сайта: раскатывает partials/footer.html по всем страницам.

Зачем
-----
Подвал жил копиями в восьми файлах и успел разойтись: где-то три ссылки,
где-то одна строка. Теперь он лежит в одном месте, а этот скрипт
подставляет его в страницы перед публикацией.

Как работает
------------
* Первый запуск: находит существующий <footer>...</footer> и заменяет его
  на содержимое partials/footer.html, обёрнутое в маркеры.
* Дальше: заменяет всё между маркерами. Повторный запуск ничего не портит.
* Если <footer> на странице нет вообще — вставляет перед </body>.

Запуск
------
    python3 build.py            # обновить все страницы
    python3 build.py --check    # только проверить, ничего не писать
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PARTIAL = ROOT / "partials" / "footer.html"

#: Страницы, куда ставим общий подвал. Кабинет (app/) не трогаем:
#: там своя вёрстка и публичный подвал ему не нужен.
PAGES = [
    "index.html",
    "uslugi.html",
    "ceny.html",
    "data.html",
    "o-nas.html",
    "kontakty.html",
    "offer.html",
    "privacy.html",
]

START = "<!-- VF-FOOTER:START — не редактировать, правьте partials/footer.html -->"
END = "<!-- VF-FOOTER:END -->"

_BETWEEN = re.compile(
    re.escape(START) + r".*?" + re.escape(END), re.DOTALL)
_FOOTER = re.compile(r"[ \t]*<footer\b.*?</footer>", re.DOTALL | re.IGNORECASE)
_BODY_END = re.compile(r"</body>", re.IGNORECASE)


def block() -> str:
    body = PARTIAL.read_text(encoding="utf-8").strip()
    return f"{START}\n{body}\n{END}"


def apply_to(text: str, blk: str) -> tuple[str, str]:
    """Вернуть (новый текст, что сделали)."""
    if _BETWEEN.search(text):
        return _BETWEEN.sub(lambda _: blk, text, count=1), "обновлён"
    if _FOOTER.search(text):
        return _FOOTER.sub(lambda _: blk, text, count=1), "заменён старый"
    if _BODY_END.search(text):
        return _BODY_END.sub(blk + "\n</body>", text, count=1), "вставлен"
    return text, "ПРОПУЩЕН: нет ни <footer>, ни </body>"


def main() -> int:
    check = "--check" in sys.argv
    if not PARTIAL.exists():
        print(f"Нет файла {PARTIAL}")
        return 1

    blk = block()
    changed = 0
    missing = 0

    for name in PAGES:
        path = ROOT / name
        if not path.exists():
            print(f"  — {name}: файла нет")
            missing += 1
            continue

        old = path.read_text(encoding="utf-8")
        new, what = apply_to(old, blk)

        if new == old:
            print(f"  = {name}: без изменений")
            continue
        if check:
            print(f"  ~ {name}: требует обновления ({what})")
            changed += 1
            continue

        path.write_text(new, encoding="utf-8")
        print(f"  ✓ {name}: {what}")
        changed += 1

    print(f"\nГотово. Страниц затронуто: {changed}. Не найдено файлов: {missing}.")
    if check and changed:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
