import { describe, expect, it } from 'vitest';
import { type CellMap, recalc } from '../../src/domain/formula';

// Engine-level integration: run whole realistic sheets through recalc.

const budget: CellMap = {
  A1: 'Category', B1: 'Amount',
  A2: 'Salary', B2: '4500',
  A3: 'Freelance', B3: '800',
  A4: 'Rent', B4: '-1500',
  A5: 'Groceries', B5: '-600',
  A6: 'Transport', B6: '-220',
  A7: 'Savings', B7: '-500',
  A8: 'Net', B8: '=SUM(B2:B7)',
};

const invoice: CellMap = {
  A1: 'Item', B1: 'Qty', C1: 'Price', D1: 'Total',
  A2: 'Consulting', B2: '10', C2: '120', D2: '=B2*C2',
  A3: 'Design', B3: '4', C3: '200', D3: '=B3*C3',
  A5: 'Subtotal', D5: '=SUM(D2:D4)',
  A6: 'Tax 18%', D6: '=D5*0.18',
  A7: 'Total', D7: '=D5+D6',
};

describe('TS-01.5 — recalc API on realistic sheets (integration)', () => {
  it('TC-01.5.1 — budget + invoice compute end-to-end', () => {
    const b = recalc(budget);
    expect(b['B8'].display).toBe('2480');

    const i = recalc(invoice);
    expect(i['D2'].display).toBe('1200');
    expect(i['D5'].display).toBe('2000');
    expect(i['D7'].display).toBe('2360');

    // every returned result has the documented shape
    for (const ref of Object.keys(i)) {
      const r = i[ref];
      expect(r).toHaveProperty('display');
      expect(r).toHaveProperty('value');
      expect(typeof r.isNumber).toBe('boolean');
      expect(typeof r.isError).toBe('boolean');
    }
  });
});
