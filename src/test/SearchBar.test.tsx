import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import SearchBar from '../components/admin/SearchBar';

/**
 * The one search box, used on every screen that has a list.
 *
 * <p>Four screens had one and seven did not, and the four that did each styled it differently.
 * Somebody who learns that typing filters the leads screen tries it on Media Library, finds
 * nothing, and concludes the CRM is inconsistent rather than that this screen was never given
 * the control.</p>
 */

describe('Search bar', () => {
  it('says what typing will actually search', () => {
    // "Search" alone leaves somebody guessing whether it covers phone numbers, courses or only
    // names — so they try once, get nothing, and stop trusting it.
    render(<SearchBar value="" onChange={() => {}} placeholder="Search by student, outcome or what they said" />);
    expect(screen.getByPlaceholderText('Search by student, outcome or what they said')).toBeInTheDocument();
  });

  it('reports what it typed', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SearchBar value="" onChange={onChange} placeholder="Search" />);

    await user.type(screen.getByRole('searchbox'), 'a');
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('shows how much of the list survived the filter', () => {
    // A filtered list of three looks identical to a screen that only ever had three things on it.
    render(<SearchBar value="rohit" onChange={() => {}} placeholder="Search" count="3 of 48" />);
    expect(screen.getByText('3 of 48')).toBeInTheDocument();
  });

  it('keeps the count out of the way until there is something to count', () => {
    render(<SearchBar value="" onChange={() => {}} placeholder="Search" count="48 of 48" />);
    expect(screen.queryByText('48 of 48')).not.toBeInTheDocument();
  });

  it('offers a way out once something is typed', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SearchBar value="rohit" onChange={onChange} placeholder="Search" />);

    await user.click(screen.getByRole('button', { name: /clear search/i }));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('shows no clear button when there is nothing to clear', () => {
    render(<SearchBar value="" onChange={() => {}} placeholder="Search" />);
    expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument();
  });
});
