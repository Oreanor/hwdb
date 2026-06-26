#!/usr/bin/env python3
"""
find_missing_castings.py
------------------------
Находит casting-страницы Hot Wheels Wiki, которых нет в твоей базе.

Идея: все каст-страницы транслюдят Template:Casting. Спрашиваем у MediaWiki API
полный список таких страниц (list=embeddedin) -> это ПОЛНЫЙ перечень кастов на вики.
Дальше диффим с твоими lnk -> остаются недостающие (премиум-онли осядут тут же).

Запускать ЛОКАЛЬНО (нужен доступ к hotwheels.fandom.com):
    pip install requests
    python3 find_missing_castings.py path/to/your_db.json

Вход  : твой JSON — список объектов, у каждого есть ключ "lnk".
Выход : missing_castings.json — [{"title": "...", "slug": "..."}, ...]
        эти slug скармливаешь СВОЕМУ существующему парсеру каст-страниц.
"""

import json
import sys
import time
import urllib.parse

import requests

API = "https://hotwheels.fandom.com/api.php"
# поставь сюда реальный контакт — Fandom не любит безымянных ботов
HEADERS = {"User-Agent": "HW-collection-sync/1.0 (personal research; you@example.com)"}
SLEEP = 0.5  # пауза между запросами, чтобы не словить бан


def norm(title: str) -> str:
    """Нормализуем ключ каста для сравнения: %xx-декод, _<->пробел, регистр."""
    t = urllib.parse.unquote(str(title))   # %27 -> ' ; %26 -> & и т.д.
    t = t.replace("_", " ").strip()
    return t.casefold()


def to_slug(title: str) -> str:
    """Титул страницы -> slug в формате твоего lnk (с подчёркиваниями)."""
    return title.replace(" ", "_")


def all_casting_titles() -> list[str]:
    """Полный список страниц (ns=0), транслюдящих Template:Casting."""
    titles, cont = [], {}
    while True:
        params = {
            "action": "query",
            "list": "embeddedin",
            "eititle": "Template:Casting",
            "einamespace": "0",        # только основные статьи
            "eilimit": "500",
            "format": "json",
            **cont,
        }
        r = requests.get(API, params=params, headers=HEADERS, timeout=30)
        r.raise_for_status()
        data = r.json()
        titles.extend(m["title"] for m in data["query"]["embeddedin"])
        if "continue" in data:
            cont = data["continue"]
            time.sleep(SLEEP)
        else:
            break
    return titles


def resolve_redirects(titles: list[str]) -> dict[str, str]:
    """Схлопываем редиректы: alias -> настоящий титул (чтобы не дублировать)."""
    mapping = {}
    for i in range(0, len(titles), 50):
        chunk = titles[i:i + 50]
        params = {
            "action": "query",
            "redirects": "1",
            "titles": "|".join(chunk),
            "format": "json",
        }
        r = requests.get(API, params=params, headers=HEADERS, timeout=30)
        r.raise_for_status()
        for red in r.json().get("query", {}).get("redirects", []):
            mapping[red["from"]] = red["to"]
        time.sleep(SLEEP)
    return mapping


def load_existing(db_path: str) -> set[str]:
    with open(db_path, encoding="utf-8") as f:
        db = json.load(f)
    keys = set()
    for rec in db:
        lnk = rec.get("lnk")
        if lnk:
            keys.add(norm(lnk))
    return keys


def main():
    db_path = sys.argv[1] if len(sys.argv) > 1 else "your_db.json"

    print(f"[*] читаю твою базу: {db_path}")
    existing = load_existing(db_path)
    print(f"    кастов в базе: {len(existing)}")

    print("[*] тяну полный список каст-страниц с вики (Template:Casting)...")
    wiki_titles = all_casting_titles()
    print(f"    всего каст-страниц на вики: {len(wiki_titles)}")

    # схлопываем редиректы, чтобы alias не считался отдельным кастом
    redir = resolve_redirects(wiki_titles)
    canonical = []
    seen = set()
    for t in wiki_titles:
        real = redir.get(t, t)
        if norm(real) not in seen:
            seen.add(norm(real))
            canonical.append(real)

    missing = [t for t in canonical if norm(t) not in existing]
    missing.sort()

    out = [{"title": t, "slug": to_slug(t)} for t in missing]
    with open("missing_castings.json", "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    print(f"[+] недостающих кастов: {len(missing)}")
    print(f"[+] записал -> missing_castings.json")
    print("\nпервые 20:")
    for t in missing[:20]:
        print("   ", t)


if __name__ == "__main__":
    main()
