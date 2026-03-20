#!/usr/bin/env python3
"""
Phase 9.5 — Normalize direct answers (3 sentences), add definition-line,
content-limitation before FAQ. Run from repo root: python3 scripts/phase9_5_hardening.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GUIDE = ROOT / "fertility-timing-guide"

LIMITATION = """      <p class="content-limitation">
        These explanations are based on general cycle timing patterns and may not reflect individual biological variation in every case.
      </p>

"""

# slug -> (direct_answer_inner_html, definition_line_text)
PAGES: dict[str, tuple[str, str]] = {
    "cycle-length-variation": (
        """Yes. Cycle length can vary month to month. A difference of a few days between cycles is common and often reflects how long the first half of the cycle (before ovulation) lasts. Calculators assume a typical pattern from your inputs; they do not predict your exact next cycle length.""",
        "Cycle length is the days from the start of one period to the day before the next; it shapes how tools estimate ovulation and the fertile window.",
    ),
    "how-long-does-ovulation-last": (
        """Ovulation—the release of an egg from an ovary—typically lasts about 12 to 24 hours. The egg can be fertilized during that short window. The fertile window spans more calendar days because sperm can survive several days before ovulation.""",
        "Ovulation timing marks the estimated day an egg is released; the fertile window includes days before and including that estimate.",
    ),
    "travel-and-cycle-timing": (
        """Yes. Travel can affect cycle timing for some people. Jet lag, disrupted sleep, stress, and routine changes may shift when ovulation or the next period occurs. Fertility calculators do not account for travel; they assume a typical pattern from last period and average cycle length only.""",
        "Cycle timing refers to when ovulation and menstruation occur; travel can disrupt the rhythms those estimates assume.",
    ),
    "can-ovulation-be-late": (
        """Yes. Ovulation can occur later than a mid-cycle or day-14 estimate suggests. When the first half of the cycle lengthens, ovulation and the fertile window shift later. That pattern is common natural variability; calculators cannot detect it without hormone-based tracking.""",
        "Late ovulation means the egg is released later in the cycle than a simple midpoint guess would suggest.",
    ),
    "what-is-regular-cycle": (
        """Yes. A regular cycle usually means similar lengths month to month, with small normal variation between periods. Irregular cycles swing more widely in length, which makes predicting the next period harder. Calculator estimates use whatever cycle length you enter; wide variation adds uncertainty.""",
        "A regular menstrual cycle is one where period-to-period length stays in a fairly narrow range for you over time.",
    ),
    "luteal-phase-length": (
        """Yes. The luteal phase is the span from ovulation to the start of the next period, often about 12 to 16 days. Many calculators assume about 14 days and count backward from the expected next period to estimate ovulation. Your actual luteal length may differ; estimates remain pattern-based.""",
        "Luteal phase length is the number of days from ovulation to the next period; it is often used as a fixed anchor in timing formulas.",
    ),
    "days-before-ovulation-fertile": (
        """Yes. You are typically fertile for about five days before ovulation and the day of ovulation. Sperm can survive several days, so the days leading up to ovulation count toward the window. Apps and calculators estimate that window; they do not confirm your exact fertile days.""",
        "The fertile window is the range of days when conception is more likely, usually centered on estimated ovulation.",
    ),
    "irregular-cycles-ovulation": (
        """Yes. You can ovulate with irregular cycles. Irregular means period-to-period length varies widely, so ovulation is harder to predict—not that it never occurs. Calculator estimates assume a stable average length; treat outputs as broad guides when cycles swing.""",
        "Ovulation timing is the estimated point in the cycle when an egg is released; irregular cycles make that estimate less certain.",
    ),
    "how-is-ovulation-calculated": (
        """Yes. Ovulation is usually estimated by counting backward from the expected next period using cycle length and your last period start date. Many tools assume ovulation about two weeks before the next period, then place a fertile window around that day. The output is educational and does not confirm that you ovulated then.""",
        "Ovulation timing refers to the estimated calendar placement of egg release derived from cycle patterns, not from lab tests.",
    ),
    "early-ovulation": (
        """Yes. You can ovulate earlier in a cycle than a day-14 or midpoint assumption suggests. A shorter first half of the cycle moves ovulation and the fertile window earlier. Calculators that assume mid-cycle timing may show a window that sits too late if you ovulate early.""",
        "Early ovulation means egg release happens sooner after your period than many average-based estimates assume.",
    ),
    "missed-period-timing": (
        """Yes. A missed or late period usually means the current cycle is longer than usual—often delayed ovulation or a longer follicular phase. Calendar tools need a clear period start; until your next period begins, the next cycle anchor is uncertain. This article addresses timing estimates only, not causes or pregnancy outcomes.""",
        "Cycle timing estimates depend on knowing when periods start; a late period weakens calendar-only predictions for that cycle.",
    ),
    "when-is-fertile-window": (
        """Yes. The fertile window is the span of days when conception is most likely—typically about five days before ovulation through ovulation day. Which calendar dates that covers depends on ovulation timing, which varies by person and by cycle. Tools estimate a window from your last period and average cycle length; they do not detect ovulation.""",
        "The fertile window is estimated from ovulation timing and sperm survival; it is not a single fixed date every month.",
    ),
    "how-fertility-calculators-work": (
        """Yes. Fertility window calculators use your last period date and average cycle length to project your next period and estimate ovulation about two weeks before it. They then display a band of fertile days around that estimate. They do not measure hormones or confirm ovulation; results are pattern-based only.""",
        "Fertility timing tools apply cycle math to your inputs; they do not observe your body in real time.",
    ),
    "is-day-14-ovulation": (
        """No. Ovulation is not always on calendar day 14. Day 14 is a shorthand for a 28-day cycle; ovulation more reliably falls about 14 days before the next period, which maps to different cycle days when length changes. Calculators adjust to your stated cycle length but still cannot know your exact ovulation day.""",
        "Ovulation timing is often described relative to the next period, not a universal day number on the calendar.",
    ),
    "can-ovulation-change-each-month": (
        """Yes. Ovulation can change each month. The first half of the cycle—from period to ovulation—often varies in length, so the egg may release on different cycle days. Calculators use average patterns; they cannot predict your exact ovulation day in a specific month.""",
        "Ovulation timing is the estimated point when an egg is released; month-to-month shifts are part of normal variability.",
    ),
    "stress-and-ovulation": (
        """Yes. Stress can affect ovulation timing because the hormonal signals that trigger ovulation may respond to prolonged or significant stress. The effect varies by person and by cycle. Fertility calculators do not measure stress; they only use cycle length and last period date.""",
        "Ovulation timing refers to when an egg is released in the cycle; stress is one factor that may shift that timing.",
    ),
}


def replace_direct_answer(html: str, inner_p: str) -> str:
    # Match first .direct-answer block in article
    pat = re.compile(
        r'(<div class="direct-answer">\s*<p>)([\s\S]*?)(</p>\s*</div>)',
        re.MULTILINE,
    )
    m = pat.search(html)
    if not m:
        raise ValueError("direct-answer block not found")
    return pat.sub(r"\1" + inner_p + r"\3", html, count=1)


def insert_definition(html: str, definition: str) -> str:
    # After first closing </div> of direct-answer (the one that follows </p>)
    needle = re.compile(
        r'(</div>\s*\n)(\s*<h2>)',
        re.MULTILINE,
    )
    m = needle.search(html)
    if not m:
        raise ValueError("could not find spot after direct-answer for definition")
    block = (
        m.group(1)
        + "\n"
        + '      <p class="definition-line">\n'
        + f"        {definition}\n"
        + "      </p>\n\n"
        + m.group(2)
    )
    return needle.sub(block, html, count=1)


def insert_limitation(html: str) -> str:
    if 'class="content-limitation"' in html:
        return html
    # Match indented FAQ section so we do not strip leading spaces
    needle = '      <section class="faq-section"'
    idx = html.find(needle)
    if idx == -1:
        # Fallback: unindented (legacy bad insert)
        needle2 = '<section class="faq-section"'
        idx = html.find(needle2)
        if idx == -1:
            raise ValueError("faq-section not found")
        return html[:idx] + LIMITATION + html[idx:]
    return html[:idx] + LIMITATION + html[idx:]


def process_cluster(path: Path, slug: str) -> None:
    inner, definition = PAGES[slug]
    html = path.read_text(encoding="utf-8")
    html = replace_direct_answer(html, inner)
    html = insert_definition(html, definition)
    html = insert_limitation(html)
    path.write_text(html, encoding="utf-8")
    print("OK", slug)


def process_hub() -> None:
    hub = GUIDE / "index.html"
    html = hub.read_text(encoding="utf-8")

    hero_da = (
        "Fertility timing refers to estimating when ovulation may occur and which cycle days are more likely for conception, using period dates and average cycle length. "
        "This guide explains how those estimates are built, why timing varies, and how QuietDue’s calculator runs locally in your browser without storing data. "
        "Individual cycles differ; these pages are informational guides, not medical confirmation of ovulation."
    )
    hub_def = (
        "Ovulation timing refers to the estimated point in a menstrual cycle when an ovary releases an egg, which determines the fertile window for informational estimates."
    )

    # Replace hero direct-answer (single block in hero)
    html = re.sub(
        r'(<div class="direct-answer">\s*<p>)([\s\S]*?)(</p>\s*</div>)',
        r"\1" + hero_da + r"\3",
        html,
        count=1,
    )

    # Insert definition after hero direct-answer, before CTA paragraph
    if 'class="definition-line"' not in html.split("<article")[0]:
        html = html.replace(
            "</div>\n      <p><a href=\"/#calculator\"",
            "</div>\n      <p class=\"definition-line\">\n        "
            + hub_def
            + "\n      </p>\n      <p><a href=\"/#calculator\"",
            1,
        )

    # Coverage note: first line inside article-content
    if 'class="coverage-note"' not in html:
        html = html.replace(
            '<article class="article-content">\n      <h2>How This Guide Is Structured</h2>',
            '<article class="article-content">\n'
            '      <p class="coverage-note">\n'
            "        This guide covers ovulation timing, fertile window estimation, cycle variability, and common timing questions using a structured, privacy-first approach.\n"
            "      </p>\n\n"
            "      <h2>How This Guide Is Structured</h2>",
            1,
        )

    # Limitation before hub FAQ
    if "<!-- FAQ Section -->" in html and 'class="content-limitation"' not in html.split("<!-- FAQ Section -->")[0]:
        pass  # insert before FAQ comment
    if 'class="content-limitation"' not in html:
        html = html.replace(
            "      <!-- FAQ Section -->\n      <section class=\"faq-section\"",
            LIMITATION + "      <!-- FAQ Section -->\n      <section class=\"faq-section\"",
            1,
        )

    hub.write_text(html, encoding="utf-8")
    print("OK hub")


def main():
    for slug in sorted(PAGES.keys()):
        p = GUIDE / slug / "index.html"
        if not p.is_file():
            raise SystemExit(f"Missing {p}")
        process_cluster(p, slug)
    process_hub()


if __name__ == "__main__":
    main()
