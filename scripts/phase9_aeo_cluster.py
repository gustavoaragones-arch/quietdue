#!/usr/bin/env python3
"""Phase 9 AEO: direct-answer wrap, key takeaways, Article about, site-identity footer."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GUIDE = ROOT / "fertility-timing-guide"

# Three bullets per slug (topic-specific, extractable)
KEY_POINTS = {
    "stress-and-ovulation": [
        "Stress can shift ovulation timing in some cycles; the effect varies by person.",
        "Fertility calculators use average cycle length and cannot measure stress or adjust for it.",
        "Timing shifts from stress are often temporary, not fixed across every cycle.",
    ],
    "is-day-14-ovulation": [
        "Ovulation is not always on day 14; day 14 fits a 28-day cycle pattern, not everyone.",
        "Ovulation often occurs about 14 days before the next period, not always on calendar day 14.",
        "Calculators adapt to your cycle length; natural variation can still move ovulation a few days.",
    ],
    "can-ovulation-change-each-month": [
        "Ovulation timing can shift month to month, even when cycles feel regular.",
        "The phase from period to ovulation varies more than the phase from ovulation to period.",
        "Calculator estimates assume an average pattern; they cannot predict your exact ovulation day.",
    ],
    "luteal-phase-length": [
        "The luteal phase is from ovulation to the next period, often ~12–16 days with 14 as a common reference.",
        "Calculators often assume a 14-day luteal phase to count backward from the expected next period.",
        "If your luteal phase differs, ovulation estimates may be a few days off.",
    ],
    "irregular-cycles-ovulation": [
        "Irregular cycles mean period-to-period length varies; ovulation can still occur.",
        "Calculators assume a predictable length, so estimates are less reliable when cycles swing widely.",
        "A calculator can still show a rough window using your average cycle length.",
    ],
    "how-is-ovulation-calculated": [
        "Ovulation is usually estimated by counting backward from the expected next period.",
        "Typical inputs are last period date and average cycle length; the tool does not measure hormones.",
        "The result is a pattern-based estimate, not confirmation of when you ovulate.",
    ],
    "days-before-ovulation-fertile": [
        "The fertile window often includes about five days before ovulation plus the day of ovulation.",
        "Sperm can survive several days, so days before ovulation count toward the window.",
        "If ovulation shifts in a cycle, the calendar position of the fertile window shifts too.",
    ],
    "what-is-regular-cycle": [
        "A regular cycle usually means similar lengths month to month, with small normal variation.",
        "Regularity helps calculator estimates; it does not lock ovulation to the same calendar day.",
        "Wide swings between cycles add uncertainty to timing estimates.",
    ],
    "when-is-fertile-window": [
        "The fertile window is when conception is more likely—typically several days before ovulation through ovulation day.",
        "Calendar dates change each cycle because ovulation timing can shift.",
        "Calculators estimate a window from your last period and average cycle length.",
    ],
    "how-fertility-calculators-work": [
        "Calculators project your next period from cycle length, then estimate ovulation and a fertile band.",
        "They do not store data, measure hormones, or confirm ovulation.",
        "Each session uses only the numbers you enter; output is educational, not diagnostic.",
    ],
    "can-ovulation-be-late": [
        "Late ovulation means a longer first half of the cycle; the fertile window shifts later.",
        "Calculators assume mid-cycle patterns and may show a window that is too early if you ovulate late.",
        "Natural variability and stress can delay ovulation without proving a medical problem.",
    ],
    "early-ovulation": [
        "Early ovulation means a shorter first half of the cycle; the fertile window moves earlier.",
        "Short cycles often place ovulation earlier than a day-14 assumption.",
        "Calculator windows may sit too late if you ovulate early; treat output as a broad guide.",
    ],
    "how-long-does-ovulation-last": [
        "The egg release (ovulation) lasts roughly 12–24 hours; the fertile window is longer because sperm persist.",
        "The window often spans about six days including days before ovulation.",
        "Calculators show a multi-day band because biology spans days, not a single hour.",
    ],
    "missed-period-timing": [
        "A late or missed period usually means a longer cycle; ovulation may have been delayed or absent that cycle.",
        "Calendar tools need a new period date to anchor the next cycle; estimates are weaker until it arrives.",
        "This article explains timing only, not causes or pregnancy outcomes.",
    ],
    "travel-and-cycle-timing": [
        "Travel and routine disruption can shift when ovulation or the next period occurs for some people.",
        "Calculators do not know your travel schedule; they use average cycle length and last period only.",
        "Effects are often temporary once routine stabilizes.",
    ],
    "cycle-length-variation": [
        "Cycle length often varies a few days month to month; that can be normal.",
        "The follicular phase (period to ovulation) usually varies more than the luteal phase.",
        "Entering an average cycle length still yields an approximate fertile window, not exact days.",
    ],
}


def wrap_direct_answer(html: str) -> str:
    if "direct-answer" in html:
        return html
    # First <p> after last-reviewed (single paragraph)
    pat = r'(<p class="last-reviewed">[^<]*</p>\s*\n\s*)(<p>)([\s\S]*?)(</p>)'
    m = re.search(pat, html)
    if not m:
        return html
    replacement = (
        m.group(1)
        + '<div class="direct-answer">\n      '
        + m.group(2)
        + m.group(3)
        + m.group(4)
        + "\n      </div>"
    )
    return html[: m.start()] + replacement + html[m.end() :]


def insert_key_takeaways(html: str, bullets: list[str]) -> str:
    if "key-takeaways" in html:
        return html
    pos = html.find('<article class="article-content">')
    if pos == -1:
        return html
    i1 = html.find("<h2", pos)
    i2 = html.find("<h2", i1 + 1)
    i3 = html.find("<h2", i2 + 1)
    if i3 == -1:
        return html
    lis = "\n".join(f"        <li>{b}</li>" for b in bullets)
    block = f"""<section class="key-takeaways">
      <h2>Key Points</h2>
      <ul>
{lis}
      </ul>
    </section>

      """
    return html[:i3] + block + html[i3:]


def add_article_about(html: str) -> str:
    if '"about":{"@type":"Thing","name":"Fertility Timing"}' in html:
        return html
    # Cluster pattern
    html = html.replace(
        '"publisher":{"@type":"Organization","name":"QuietDue"},"mainEntityOfPage"',
        '"publisher":{"@type":"Organization","name":"QuietDue"},"about":{"@type":"Thing","name":"Fertility Timing"},"mainEntityOfPage"',
        1,
    )
    return html


def add_footer_identity(html: str) -> str:
    if "site-identity" in html:
        return html
    return html.replace(
        '<p class="copyright">© 2026 QuietDue</p>',
        '<p class="site-identity">QuietDue is a privacy-first fertility timing resource providing informational cycle estimates without storing personal data.</p>\n    <p class="copyright">© 2026 QuietDue</p>',
        1,
    )


def process_cluster_file(path: Path) -> None:
    slug = path.parent.name
    html = path.read_text(encoding="utf-8")
    bullets = KEY_POINTS.get(slug)
    if not bullets:
        print(f"SKIP (no KEY_POINTS): {path}")
        return
    html = wrap_direct_answer(html)
    html = insert_key_takeaways(html, bullets)
    html = add_article_about(html)
    html = add_footer_identity(html)
    path.write_text(html, encoding="utf-8")
    print(f"OK {slug}")


def main():
    for p in sorted(GUIDE.glob("*/index.html")):
        process_cluster_file(p)


if __name__ == "__main__":
    main()
