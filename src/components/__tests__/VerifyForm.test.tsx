import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VerifyForm from "../VerifyForm";

describe("VerifyForm", () => {
  it("does NOT call onSubmit when the field is empty", async () => {
    const onSubmit = jest.fn();
    render(<VerifyForm onSubmit={onSubmit} isLoading={false} />);

    const button = screen.getByRole("button", { name: /verify contract/i });
    expect(button).toBeDisabled();
    fireEvent.click(button);

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows error and does NOT call onSubmit when value does not start with C", async () => {
    const onSubmit = jest.fn();
    const user = userEvent.setup();
    render(<VerifyForm onSubmit={onSubmit} isLoading={false} />);

    const input = screen.getByPlaceholderText("C... (Soroban Contract ID)");
    await user.type(input, "HOLA");

    const button = screen.getByRole("button", { name: /verify contract/i });
    await user.click(button);

    expect(await screen.findByText("Contract ID must start with C")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows 'Contract ID is too short' and does NOT call onSubmit when value is < 10 chars", async () => {
    const onSubmit = jest.fn();
    const user = userEvent.setup();
    render(<VerifyForm onSubmit={onSubmit} isLoading={false} />);

    const input = screen.getByPlaceholderText("C... (Soroban Contract ID)");
    await user.type(input, "CABC");

    const button = screen.getByRole("button", { name: /verify contract/i });
    await user.click(button);

    expect(await screen.findByText("Contract ID is too short")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with trimmed value when input is valid", async () => {
    const onSubmit = jest.fn();
    const user = userEvent.setup();
    render(<VerifyForm onSubmit={onSubmit} isLoading={false} />);

    const input = screen.getByPlaceholderText("C... (Soroban Contract ID)");
    await user.type(input, "CABC1234567890");

    const button = screen.getByRole("button", { name: /verify contract/i });
    await user.click(button);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith("CABC1234567890");
  });

  it("shows 'Verifying...' and disables button when isLoading is true", () => {
    const onSubmit = jest.fn();
    render(<VerifyForm onSubmit={onSubmit} isLoading={true} />);

    expect(screen.getByText("Verifying...")).toBeInTheDocument();

    const button = screen.getByRole("button", { name: /verifying/i });
    expect(button).toBeDisabled();
  });
});
