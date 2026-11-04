# Adds short end-of-line comments from a JSON map {"line number": "comment"} to a source file.
# Usage: python scripts/annotate.py <file> <map.json>   (comment style by extension: // for ts/tsx/js, # for py, -- for sql)
import json, sys, pathlib

path, mapfile = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
marks = {int(k): v for k, v in json.loads(mapfile.read_text(encoding="utf-8")).items()}
mark = {".py": "#", ".sql": "--"}.get(path.suffix, "//")
lines = path.read_text(encoding="utf-8").split("\n")
done = 0
for n, text in marks.items():
    line = lines[n - 1]
    if mark in line or not line.strip():  # skip lines that already have a comment, and blank lines
        continue
    lines[n - 1] = f"{line.rstrip()}  {mark} {text}"
    done += 1
path.write_text("\n".join(lines), encoding="utf-8")
print(f"{path}: {done} lines commented")
