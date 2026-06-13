#!/usr/bin/env python3
"""Generate 10 realistic distilled-spirits labels as PNGs for test fixtures."""
import os, json, urllib.parse
from playwright.sync_api import sync_playwright

OUT = "/mnt/user-data/outputs/labels"
os.makedirs(OUT, exist_ok=True)

GOV = ('<b>GOVERNMENT WARNING:</b> (1) According to the Surgeon General, women '
       'should not drink alcoholic beverages during pregnancy because of the risk '
       'of birth defects. (2) Consumption of alcoholic beverages impairs your '
       'ability to drive a car or operate machinery, and may cause health problems.')

def noise(opacity=0.05, seed=2, freq=0.9):
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160">'
           f'<filter id="n"><feTurbulence type="fractalNoise" baseFrequency="{freq}" '
           f'numOctaves="2" seed="{seed}" stitchTiles="stitch"/>'
           f'<feColorMatrix type="saturate" values="0"/></filter>'
           f'<rect width="100%" height="100%" filter="url(#n)" opacity="{opacity}"/></svg>')
    return "url('data:image/svg+xml," + urllib.parse.quote(svg) + "')"

# ---- ornaments (signature element per label) -----------------------------
def laurel_crest(stroke, fill):
    return f'''<svg viewBox="0 0 120 120" width="100%" height="100%">
      <circle cx="60" cy="60" r="54" fill="none" stroke="{stroke}" stroke-width="1.5"/>
      <circle cx="60" cy="60" r="48" fill="none" stroke="{stroke}" stroke-width="0.8"/>
      <path d="M60 18 L66 30 L60 27 L54 30 Z" fill="{stroke}"/>
      <g stroke="{stroke}" stroke-width="1.4" fill="none">
        <path d="M40 88 Q30 70 34 50"/><path d="M80 88 Q90 70 86 50"/></g>
      <g fill="{fill}">
        <ellipse cx="34" cy="56" rx="4" ry="2" transform="rotate(-35 34 56)"/>
        <ellipse cx="36" cy="64" rx="4" ry="2" transform="rotate(-20 36 64)"/>
        <ellipse cx="40" cy="72" rx="4" ry="2" transform="rotate(-5 40 72)"/>
        <ellipse cx="86" cy="56" rx="4" ry="2" transform="rotate(35 86 56)"/>
        <ellipse cx="84" cy="64" rx="4" ry="2" transform="rotate(20 84 64)"/>
        <ellipse cx="80" cy="72" rx="4" ry="2" transform="rotate(5 80 72)"/></g>
      <text x="60" y="68" text-anchor="middle" font-family="Cinzel" font-size="34"
        fill="{stroke}" font-weight="700">{{mono}}</text></svg>'''

def botanical(stroke):
    return f'''<svg viewBox="0 0 120 120" width="100%" height="100%" stroke="{stroke}"
      fill="none" stroke-width="1.3" stroke-linecap="round">
      <path d="M60 110 C60 80 60 50 60 22"/>
      <path d="M60 40 C46 34 40 24 42 14 C54 18 60 28 60 40"/>
      <path d="M60 40 C74 34 80 24 78 14 C66 18 60 28 60 40"/>
      <path d="M60 60 C48 56 42 48 44 40 C54 44 60 50 60 60"/>
      <path d="M60 60 C72 56 78 48 76 40 C66 44 60 50 60 60"/>
      <path d="M60 80 C50 77 45 71 47 64 C55 67 60 73 60 80"/>
      <path d="M60 80 C70 77 75 71 73 64 C65 67 60 73 60 80"/>
      <circle cx="60" cy="16" r="3" fill="{stroke}"/></svg>'''

def deco_sun(stroke):
    rays = "".join(f'<line x1="60" y1="60" x2="{60+50*__import__("math").cos(a)}" '
                   f'y2="{60+50*__import__("math").sin(a)}"/>'
                   for a in [i*3.14159/8 for i in range(16)])
    return f'''<svg viewBox="0 0 120 120" width="100%" height="100%" stroke="{stroke}"
      stroke-width="0.8">{rays}<circle cx="60" cy="60" r="20" fill="none"
      stroke="{stroke}" stroke-width="1.5"/><circle cx="60" cy="60" r="8" fill="{stroke}"/></svg>'''

def compass(stroke, fill):
    return f'''<svg viewBox="0 0 120 120" width="100%" height="100%">
      <circle cx="60" cy="60" r="50" fill="none" stroke="{stroke}" stroke-width="1.5"/>
      <circle cx="60" cy="60" r="42" fill="none" stroke="{stroke}" stroke-width="0.6"/>
      <polygon points="60,14 68,60 60,52 52,60" fill="{fill}"/>
      <polygon points="60,106 52,60 60,68 68,60" fill="{stroke}"/>
      <polygon points="14,60 60,52 52,60 60,68" fill="{stroke}"/>
      <polygon points="106,60 60,68 68,60 60,52" fill="{stroke}"/>
      <circle cx="60" cy="60" r="4" fill="{stroke}"/>
      <text x="60" y="30" text-anchor="middle" font-family="Cinzel" font-size="9"
        fill="{stroke}">N</text></svg>'''

def agave(stroke):
    blades = "".join(f'<path d="M60 100 Q{60+d} 50 {60+d*1.6} {18+abs(d)*0.2}" '
                     f'stroke="{stroke}" fill="none" stroke-width="1.4"/>'
                     for d in [-34,-22,-11,0,11,22,34])
    return f'<svg viewBox="0 0 120 120" width="100%" height="100%">{blades}</svg>'

def orchard(stroke, fill):
    return f'''<svg viewBox="0 0 120 120" width="100%" height="100%">
      <circle cx="60" cy="66" r="30" fill="none" stroke="{stroke}" stroke-width="1.5"/>
      <path d="M60 36 C58 28 64 24 70 26" fill="none" stroke="{stroke}" stroke-width="1.5"/>
      <path d="M70 26 C78 22 84 30 80 38 C76 32 72 32 70 36 Z" fill="{fill}"/>
      <circle cx="52" cy="60" r="3" fill="{stroke}"/></svg>'''

def floral(stroke, fill):
    petals = "".join(f'<ellipse cx="60" cy="36" rx="7" ry="16" fill="{fill}" '
                     f'transform="rotate({a} 60 60)" opacity="0.9"/>'
                     for a in range(0,360,45))
    return (f'<svg viewBox="0 0 120 120" width="100%" height="100%">{petals}'
            f'<circle cx="60" cy="60" r="8" fill="{stroke}"/></svg>')

def stamp(stroke):
    return f'''<svg viewBox="0 0 120 120" width="100%" height="100%">
      <rect x="14" y="14" width="92" height="92" fill="none" stroke="{stroke}"
        stroke-width="2" stroke-dasharray="6 4"/>
      <rect x="22" y="22" width="76" height="76" fill="none" stroke="{stroke}"
        stroke-width="0.8"/>
      <text x="60" y="55" text-anchor="middle" font-family="Oswald" font-size="13"
        fill="{stroke}" font-weight="600">BOTTLED</text>
      <text x="60" y="74" text-anchor="middle" font-family="Oswald" font-size="13"
        fill="{stroke}" font-weight="600">IN BOND</text></svg>'''

# ---- 10 label specifications ---------------------------------------------
L = [
 dict(file="01_old_tom_bourbon", w=720, h=860, layout="classic",
   brand="OLD TOM DISTILLERY", cls="Kentucky Straight Bourbon Whiskey",
   abv="45% Alc./Vol. (90 Proof)", net="750 mL", mono="OT",
   est="EST. 1887", loc="Bardstown, Kentucky", line1="Distilled & Bottled by",
   line2="Old Tom Distilling Co.", batch="Batch No. 042", extra="Barrel No. 17 \u2022 Aged 6 Years",
   paper="#efe2c4", ink="#3a2412", accent="#7a3b16", deco="#9a6b2f",
   fb="Cinzel", fbrand="Cinzel", fbody="EB Garamond", ornament="laurel"),

 dict(file="02_northwind_gin", w=640, h=900, layout="botanical",
   brand="NORTHWIND", cls="London Dry Gin", abv="47% Alc./Vol. (94 Proof)",
   net="700 mL", est="DISTILLED 2019", loc="Portland, Oregon",
   line1="Small Batch \u2022 Copper Pot Distilled", line2="The Northwind Gin Works",
   batch="Botanicals: Juniper \u00b7 Coriander \u00b7 Angelica", extra="Bottle 0231 of 1200",
   paper="#eef3f4", ink="#16323e", accent="#2c6e7f", deco="#5e9aa8",
   fbrand="Playfair Display", fbody="EB Garamond", ornament="botanical"),

 dict(file="03_crystal_meridian_vodka", w=680, h=820, layout="deco",
   brand="CRYSTAL MERIDIAN", cls="Premium Vodka", abv="40% Alc./Vol. (80 Proof)",
   net="1 L", est="", loc="Distilled in the U.S.A.",
   line1="Distilled Five Times", line2="Charcoal Filtered",
   batch="", extra="", paper="#101216", ink="#e9e6df", accent="#c8a24a",
   deco="#6f7681", fbrand="Limelight", fbody="Oswald", ornament="deco"),

 dict(file="04_isla_vieja_tequila", w=700, h=880, layout="latin",
   brand="ISLA VIEJA", cls="Tequila A\u00f1ejo", abv="38% Alc./Vol. (76 Proof)",
   net="750 mL", est="EST. 1962", loc="Jalisco, M\u00e9xico",
   line1="100% de Agave Azul", line2="Hecho en M\u00e9xico \u2022 NOM 1124",
   batch="Lote A-09", extra="Reposado en Barrica de Roble \u2022 24 Meses",
   paper="#f3e4cd", ink="#5a2e12", accent="#b5641e", deco="#7d8a3c",
   fbrand="Cinzel", fbody="EB Garamond", ornament="agave"),

 dict(file="05_barrel_oak_rye", w=820, h=620, layout="stamped",
   brand="BARREL & OAK", cls="Straight Rye Whiskey", abv="50% Alc./Vol. (100 Proof)",
   net="750 mL", est="EST. 2014", loc="Hudson Valley, New York",
   line1="Bottled in Bond", line2="Distilled, Aged & Bottled by Barrel & Oak Co.",
   batch="Batch 7", extra="95% Rye \u2022 Aged 4 Years", paper="#d8c7a4",
   ink="#23211c", accent="#5b3a1a", deco="#3d3a31", fbrand="Oswald",
   fbody="Spectral", ornament="stamp"),

 dict(file="06_glen_carrick_scotch", w=680, h=900, layout="classic",
   brand="GLEN CARRICK", cls="Single Malt Scotch Whisky", abv="43% Alc./Vol. (86 Proof)",
   net="700 mL", mono="GC", est="EST. 1824", loc="Speyside, Scotland",
   line1="Aged 12 Years", line2="Distilled & Bottled in Scotland",
   batch="Cask No. 3318", extra="Non Chill-Filtered", paper="#e7ddc3",
   ink="#1f3326", accent="#2f5238", deco="#a98b3a", fbrand="Cinzel",
   fbody="Cardo", ornament="laurel"),

 dict(file="07_cane_compass_rum", w=720, h=820, layout="nautical",
   brand="CANE & COMPASS", cls="Aged Caribbean Rum", abv="40% Alc./Vol. (80 Proof)",
   net="750 mL", est="EST. 1901", loc="Bridgetown, Barbados",
   line1="Pot & Column Blend", line2="Distilled & Bottled in the Caribbean",
   batch="Solera Aged 8 Years", extra="Cask No. C-114", paper="#0f1c2b",
   ink="#ecd9a8", accent="#c79a3e", deco="#6b8aa3", fbrand="Cinzel",
   fbody="EB Garamond", ornament="compass"),

 dict(file="08_maison_lumiere_cognac", w=660, h=900, layout="elegant",
   brand="MAISON LUMI\u00c8RE", cls="Cognac V.S.O.P.", abv="40% Alc./Vol. (80 Proof)",
   net="700 mL", est="FOND\u00c9E 1843", loc="Cognac, France",
   line1="Eaux-de-Vie Vieillies en F\u00fbt de Ch\u00eane", line2="Mis en Bouteille \u00e0 la Propri\u00e9t\u00e9",
   batch="Assemblage No. 21", extra="Grande Champagne", paper="#f6efdc",
   ink="#4a3411", accent="#8c6a1f", deco="#b89a4e", fbrand="Playfair Display",
   fbody="EB Garamond", ornament="deco"),

 dict(file="09_hollow_creek_brandy", w=620, h=840, layout="orchard",
   brand="HOLLOW CREEK", cls="Small Batch Apple Brandy", abv="42% Alc./Vol. (84 Proof)",
   net="375 mL", est="EST. 2008", loc="Sonoma County, California",
   line1="Distilled from Estate-Pressed Cider", line2="Distilled & Bottled by Hollow Creek Orchards",
   batch="Batch No. 19", extra="Aged 3 Years in Oak", paper="#f0e3d0",
   ink="#5b1f1a", accent="#9c3b24", deco="#7a8c4a", fbrand="Cardo",
   fbody="Spectral", ornament="orchard"),

 dict(file="10_velvet_thorn_liqueur", w=700, h=820, layout="floral",
   brand="VELVET THORN", cls="Blackberry Liqueur", abv="20% Alc./Vol. (40 Proof)",
   net="500 mL", est="", loc="Asheville, North Carolina",
   line1="Made with Real Blackberries", line2="Produced & Bottled by Velvet Thorn Cordials",
   batch="Batch 31", extra="Natural Fruit Liqueur", paper="#1a0f1f",
   ink="#f0e3ef", accent="#c07ab0", deco="#9b5d8f", fbrand="Cormorant",
   fbody="EB Garamond", ornament="floral"),
]

def orn_svg(spec):
    o = spec["ornament"]; ink=spec["ink"]; accent=spec["accent"]; deco=spec["deco"]
    if o=="laurel": return laurel_crest(ink, accent).replace("{mono}", spec.get("mono",""))
    if o=="botanical": return botanical(accent)
    if o=="deco": return deco_sun(spec["accent"])
    if o=="agave": return agave(spec["deco"])
    if o=="compass": return compass(spec["ink"], spec["accent"])
    if o=="orchard": return orchard(spec["accent"], spec["deco"])
    if o=="floral": return floral(spec["ink"], spec["accent"])
    if o=="stamp": return stamp(spec["ink"])
    return ""

def html(spec):
    s = spec
    dark = s["paper"].startswith("#1") or s["paper"].startswith("#0")
    batch_html = f'<div class="meta">{s["batch"]}</div>' if s.get("batch") else ""
    extra_html = f'<div class="meta">{s["extra"]}</div>' if s.get("extra") else ""
    est_html = f'<div class="est">{s["est"]}</div>' if s.get("est") else ""
    return f'''<!doctype html><html><head><meta charset="utf-8"><style>
    * {{ margin:0; padding:0; box-sizing:border-box; }}
    body {{ background:#888; }}
    .label {{
      width:{s["w"]}px; height:{s["h"]}px; position:relative; overflow:hidden;
      background:{s["paper"]}; color:{s["ink"]};
      display:flex; flex-direction:column; align-items:center;
      text-align:center; padding:46px 44px;
      box-shadow:0 0 0 1px rgba(0,0,0,.15);
    }}
    .label::after {{ content:""; position:absolute; inset:0; pointer-events:none;
      background-image:{noise(0.06 if not dark else 0.08, 3)}; mix-blend-mode:overlay; }}
    .frame {{ position:absolute; inset:18px; border:2px solid {s["accent"]};
      pointer-events:none; }}
    .frame::before {{ content:""; position:absolute; inset:6px;
      border:1px solid {s["deco"]}; }}
    .inner {{ position:relative; z-index:2; display:flex; flex-direction:column;
      align-items:center; justify-content:space-between; height:100%; width:100%; }}
    .top, .mid, .bot {{ width:100%; }}
    .est {{ font-family:"EB Garamond",serif; letter-spacing:.34em; font-size:13px;
      text-transform:uppercase; color:{s["accent"]}; margin-bottom:6px; }}
    .loc {{ font-family:"EB Garamond",serif; font-style:italic; font-size:15px;
      color:{s["deco"]}; letter-spacing:.06em; }}
    .orn {{ width:118px; height:118px; margin:12px auto 6px; }}
    .brand {{ font-family:"{s["fbrand"]}",serif; line-height:1.0; color:{s["ink"]};
      letter-spacing:.04em; }}
    .cls {{ font-family:"{s["fbody"]}",serif; font-size:19px; letter-spacing:.16em;
      text-transform:uppercase; color:{s["accent"]}; margin-top:14px; line-height:1.4; }}
    .rule {{ width:62%; height:1px; background:{s["deco"]}; margin:16px auto; position:relative; }}
    .rule::before {{ content:"\u2666"; position:absolute; left:50%; top:-9px;
      transform:translateX(-50%); background:{s["paper"]}; padding:0 8px;
      color:{s["accent"]}; font-size:12px; }}
    .tag {{ font-family:"{s["fbody"]}",serif; font-style:italic; font-size:16px;
      color:{s["ink"]}; opacity:.85; line-height:1.5; }}
    .meta {{ font-family:"{s["fbody"]}",serif; font-size:13px; letter-spacing:.04em;
      color:{s["deco"]}; margin-top:4px; }}
    .specs {{ display:flex; justify-content:center; gap:22px; align-items:baseline;
      font-family:"{s["fbody"]}",serif; margin-top:10px; }}
    .specs .abv {{ font-size:16px; font-weight:600; letter-spacing:.05em; color:{s["ink"]}; }}
    .specs .dot {{ color:{s["accent"]}; }}
    .specs .net {{ font-size:16px; font-weight:600; letter-spacing:.08em; color:{s["ink"]}; }}
    .producer {{ font-family:"{s["fbody"]}",serif; font-size:12px; line-height:1.5;
      color:{s["deco"]}; margin-top:8px; }}
    .gov {{ font-family:"Liberation Sans","DejaVu Sans",sans-serif; font-size:8px;
      line-height:1.32; text-align:justify; color:{s["ink"]}; opacity:.72;
      max-width:90%; margin:12px auto 0; }}
    .gov b {{ font-weight:700; }}
    </style></head><body>
    <div class="label" id="label">
      <div class="frame"></div>
      <div class="inner">
        <div class="top">
          {est_html}
          <div class="loc">{s["loc"]}</div>
          <div class="orn">{orn_svg(s)}</div>
        </div>
        <div class="mid">
          <div class="brand" style="font-size:{brand_size(s)}px">{brand_markup(s)}</div>
          <div class="cls">{s["cls"]}</div>
          <div class="rule"></div>
          <div class="tag">{s["line1"]}</div>
          {batch_html}{extra_html}
        </div>
        <div class="bot">
          <div class="specs">
            <span class="abv">{s["abv"]}</span>
            <span class="dot">\u2666</span>
            <span class="net">{s["net"]}</span>
          </div>
          <div class="producer">{s["line2"]}</div>
          <div class="gov">{GOV}</div>
        </div>
      </div>
    </div></body></html>'''

def brand_size(s):
    n = len(s["brand"])
    base = 64 if s["layout"] in ("classic","latin","elegant","nautical") else 58
    if n > 13: base -= 12
    if n > 17: base -= 8
    return base

def brand_markup(s):
    # split two-word brands onto styled lines for some layouts
    if "&" in s["brand"]:
        a,b = s["brand"].split("&")
        return f'{a.strip()}<span style="font-size:.5em; vertical-align:middle; color:{s["accent"]}; padding:0 .18em">&amp;</span>{b.strip()}'
    return s["brand"]

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(device_scale_factor=2)
        manifest = []
        for spec in L:
            page.set_content(html(spec), wait_until="networkidle")
            page.wait_for_timeout(180)
            el = page.query_selector("#label")
            path = os.path.join(OUT, spec["file"] + ".png")
            el.screenshot(path=path)
            manifest.append({k: spec[k] for k in
                ("file","brand","cls","abv","net")})
            print("rendered", spec["file"])
        browser.close()
    with open(os.path.join(OUT, "labels_manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2)
    print("done ->", OUT)

if __name__ == "__main__":
    main()
