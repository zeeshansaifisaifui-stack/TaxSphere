import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEXT_EXT = {".html", ".css", ".js", ".md", ".py", ".ps1", ".json", ".svg", ".txt"}
SELF = os.path.basename(__file__).lower()

# Byte sequences that only ever appear as UTF-8-decoded-as-cp1252 damage.
MOJIBAKE_MARKERS = [
    "\u00e2\u0080",   # a-circumflex + control  (a-circumflex-euro)
    "\u00e2\u20ac",   # right double quote misread
    "\u00e2\u20ac\u2122",  # trademark sign misread
    "\u00c3\u00a9",   # A-tilde + copyright
    "\u00c3\u2014",   # A-tilde + em dash misread
    "\u00c2\u00b7",   # A-circumflex + middle dot
    "\u00c3\u0192",   # A-tilde + florin
    "\ufffd",              # U+FFFD replacement character
]

TAGLINE = (
    "आपके "
    "व्यवसाय "
    "के लिए "
    "सरल "
    "टैक्स "
    "समाधान"
)

bom = []
crlf = []
mojibake = []
checked = []

for dirpath, dirnames, filenames in os.walk(ROOT):
    dirnames[:] = [d for d in dirnames if d not in {".git", "node_modules"}]
    for name in sorted(filenames):
        ext = os.path.splitext(name)[1].lower()
        if ext not in TEXT_EXT and name != ".gitattributes":
            continue
        path = os.path.join(dirpath, name)
        rel = os.path.relpath(path, ROOT).replace("\\", "/")
        checked.append(rel)
        if os.path.basename(rel).lower() == SELF:
            continue
        raw = open(path, "rb").read()
        if raw[:3] == b"\xef\xbb\xbf":
            bom.append(rel)
        try:
            text = raw.decode("utf-8")
        except UnicodeDecodeError as exc:
            mojibake.append("{} (INVALID UTF-8: {})".format(rel, exc))
            continue
        if "\r\n" in text:
            crlf.append(rel)
        for marker in MOJIBAKE_MARKERS:
            if marker in text:
                i = text.index(marker)
                snippet = text[max(0, i - 30): i + 30].replace("\n", "\\n")
                mojibake.append("{} :: ...{}...".format(rel, snippet))
                break

print("files checked : {}".format(len(checked)))
for c in checked:
    print("  " + c)
print()
print("UTF-8 BOM     : {}".format(bom if bom else "NONE"))
print("CRLF          : {}".format(crlf if crlf else "NONE"))
print("MOJIBAKE      : {}".format(mojibake if mojibake else "NONE"))

idx = os.path.join(ROOT, "index.html")
html = open(idx, encoding="utf-8").read()
found = TAGLINE in html
print("hindi tagline : {}".format("OK (byte-exact)" if found else "MISSING/CORRUPT"))
print("taxsphere11   : {} occurrence(s)".format(html.count("instagram.com/taxsphere11")))

fail = bool(bom or crlf or mojibake) or not found
print("RESULT: {}".format("FAIL" if fail else "PASS"))
sys.exit(1 if fail else 0)