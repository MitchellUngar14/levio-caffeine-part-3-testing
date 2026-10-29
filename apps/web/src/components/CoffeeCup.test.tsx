import { renderToStaticMarkup } from "react-dom/server";
import { CoffeeCup } from "./CoffeeCup";

const render = (mg: number, limit = 400) => renderToStaticMarkup(<CoffeeCup mg={mg} limit={limit} />);

describe("CoffeeCup", () => {
  it("is empty with no steam at 0 mg", () => {
    const html = render(0);
    expect(html).toContain("cup empty: log a drink");
    expect(html).toContain('aria-label="Coffee cup 0 percent full: 0 of 400 milligrams"');
    expect(html).not.toContain('class="steam');
    expect(html).not.toContain('class="drip"');
  });

  it("fills in proportion and steams", () => {
    const html = render(100);
    expect(html).toContain("25% of daily limit");
    expect(html).toContain('class="steam s1"');
    expect(html).toContain('height="37"'); // 25% of the 147 px inner height
    expect(html).not.toContain('class="drip"');
  });

  it("turns amber at the limit", () => {
    const html = render(400);
    expect(html).toContain("limit reached");
    expect(html).toContain("fill:var(--warn)");
    expect(html).not.toContain('class="drip"');
  });

  it("overflows past the limit", () => {
    const html = render(434);
    expect(html).toContain("!! overflow: +34 mg");
    expect(html).toContain("overflowing");
    expect(html).toContain('class="drip"');
    expect(html).toContain('height="147"'); // capped at full
  });

  it("never divides by zero", () => {
    expect(() => render(10, 0)).not.toThrow();
  });
});
