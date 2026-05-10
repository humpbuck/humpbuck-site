import csv
import json
from pathlib import Path
import re

BASE = Path(r"c:\Users\Administrator\Desktop\菜鸟国际&燕文物流表格")
OH_FILE = BASE / "《菜鸟跨境产品报价表-20260418010526》-OH.csv"
S5_FILE = BASE / "《菜鸟跨境产品报价表-S5059.csv"
YW_FILE = BASE / "东莞燕文报价单20260413版-燕文484.csv"
ISO_TXT = BASE / "东莞燕文报价单20260413版-燕文-国家二字码（UTF-8）.txt"
OUT_JSON = Path(r"h:\MY-STORES\humpbuck-site\lib\data\logistics-audit.json")


def read_csv_rows(path: Path):
    for enc in ("utf-8-sig", "gb18030", "utf-16"):
        try:
            with path.open("r", encoding=enc, newline="") as f:
                return list(csv.reader(f))
        except Exception:
            pass
    return []


def read_dict_rows(path: Path):
    for enc in ("utf-8-sig", "gb18030", "utf-16"):
        try:
            with path.open("r", encoding=enc, newline="") as f:
                return list(csv.DictReader(f))
        except Exception:
            pass
    return []


def is_iso2(v: str) -> bool:
    return bool(re.fullmatch(r"[A-Z]{2}", (v or "").strip().upper()))


iso_map = {}
for r in read_dict_rows(ISO_TXT):
    zh = (r.get("国家名称") or "").strip()
    iso = (r.get("国家二字码") or "").strip().upper()
    if zh and is_iso2(iso):
        iso_map[zh] = iso


def extract_oh_s5(path: Path):
    rows = read_csv_rows(path)
    raw_rows = 0
    names = []
    iso_set = set()
    zoned = {
        "AU": set(),
        "MY": set(),
        "PH": set(),
    }
    for r in rows:
        if len(r) < 2:
            continue
        name = (r[1] or "").strip()
        if not name or name in {"国家/地区", "国家"}:
            continue
        raw_rows += 1
        names.append(name)
        mapped = iso_map.get(name)
        if mapped:
            iso_set.add(mapped)

        if name.startswith("澳大利亚/"):
            zoned["AU"].add(name)
            iso_set.add("AU")
        if name in {"马来西亚/东马", "马来西亚/西马"}:
            zoned["MY"].add(name)
            iso_set.add("MY")
        if name in {"菲律宾/菲律宾其他地区", "菲律宾/菲律宾马尼拉大都"}:
            zoned["PH"].add(name)
            iso_set.add("PH")

    return {
        "raw_row_count": raw_rows,
        "unique_country_labels": sorted(set(names)),
        "iso2": sorted(iso_set),
        "zoned_labels": {k: sorted(v) for k, v in zoned.items()},
    }


def extract_yanwen(path: Path):
    rows = read_csv_rows(path)
    raw_rows = 0
    raw_codes = []
    iso_set = set()
    for r in rows:
        if len(r) < 3:
            continue
        c = (r[2] or "").strip().upper()
        if not c or c == "COUNTRYCODE":
            continue
        raw_rows += 1
        raw_codes.append(c)
        if is_iso2(c):
            iso_set.add(c)
    return {
        "raw_row_count": raw_rows,
        "raw_codes_unique": sorted(set(raw_codes)),
        "iso2": sorted(iso_set),
        "dropped_non_iso2": sorted({c for c in set(raw_codes) if not is_iso2(c)}),
    }


oh = extract_oh_s5(OH_FILE)
s5 = extract_oh_s5(S5_FILE)
yw = extract_yanwen(YW_FILE)

payload = {
    "oh": oh,
    "s5059": s5,
    "yanwen484": yw,
    "summary": {
        "oh_raw_rows": oh["raw_row_count"],
        "oh_iso2_count": len(oh["iso2"]),
        "s5059_raw_rows": s5["raw_row_count"],
        "s5059_iso2_count": len(s5["iso2"]),
        "yanwen_raw_rows": yw["raw_row_count"],
        "yanwen_iso2_count": len(yw["iso2"]),
    },
}

OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
OUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(payload["summary"], ensure_ascii=False))
