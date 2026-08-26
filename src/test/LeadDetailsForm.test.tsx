import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import LeadDetailsForm from '../components/admin/LeadDetailsForm';
import { LeadDTO } from '../dtos';

/**
 * Correcting a student's own details.
 *
 * <p>Everything else about a lead could be changed — grade, stage, course, owner, fee plan — and
 * the four things a counsellor most often gets wrong could not. A name misheard at the counter,
 * a digit dropped from a phone number: permanent, on the record the student is called from.</p>
 */

const lead = {
  id: 'l1',
  fullName: 'Rohit Deshmukh',
  mobileNumber: '9876543210',
  email: 'rohit@example.com',
  cityName: 'Parbhani',
  courseInterested: 'Data Analytics',
} as LeadDTO;

const form = (onSave = vi.fn(), onCancel = vi.fn()) => {
  render(<LeadDetailsForm lead={lead} onSave={onSave} onCancel={onCancel} />);
  return { onSave, onCancel };
};

describe('Lead details form', () => {
  it('opens showing what is already recorded', () => {
    form();
    expect(screen.getByLabelText(/full name/i)).toHaveValue('Rohit Deshmukh');
    expect(screen.getByLabelText(/mobile number/i)).toHaveValue('9876543210');
    expect(screen.getByLabelText(/city/i)).toHaveValue('Parbhani');
  });

  it('sends only what changed', async () => {
    // A form that posts everything it holds overwrites fields somebody else edited while this
    // drawer sat open.
    const user = userEvent.setup();
    const { onSave } = form();

    await user.clear(screen.getByLabelText(/full name/i));
    await user.type(screen.getByLabelText(/full name/i), 'Rohit Deshmukh Jr');
    await user.click(screen.getByRole('button', { name: /save details/i }));

    expect(onSave).toHaveBeenCalledWith({ fullName: 'Rohit Deshmukh Jr' });
  });

  it('sends several fields when several changed', async () => {
    const user = userEvent.setup();
    const { onSave } = form();

    await user.clear(screen.getByLabelText(/mobile number/i));
    await user.type(screen.getByLabelText(/mobile number/i), '9999988888');
    await user.clear(screen.getByLabelText(/city/i));
    await user.type(screen.getByLabelText(/city/i), 'Selu');
    await user.click(screen.getByRole('button', { name: /save details/i }));

    expect(onSave).toHaveBeenCalledWith({ mobileNumber: '9999988888', cityName: 'Selu' });
  });

  it('does not call the server when nothing was touched', async () => {
    // Saving an unchanged form would write an update and a timeline entry saying something
    // happened, when nothing did.
    const user = userEvent.setup();
    const { onSave, onCancel } = form();

    await user.click(screen.getByRole('button', { name: /save details/i }));

    expect(onSave).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalled();
  });

  it('trims what was typed, so a stray space is not a change', async () => {
    const user = userEvent.setup();
    const { onSave, onCancel } = form();

    await user.type(screen.getByLabelText(/city/i), '   ');
    await user.click(screen.getByRole('button', { name: /save details/i }));

    expect(onSave).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalled();
  });

  it('warns that a duplicate number is refused rather than merged', async () => {
    form();
    expect(screen.getByText(/already belongs to another student/i)).toBeInTheDocument();
  });
});
