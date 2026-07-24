import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SchoolSelector } from "./school-selector";

describe("SchoolSelector", () => {
  it("searches by abbreviation and reports the result count", async () => {
    const user = userEvent.setup();
    render(<SchoolSelector onChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Choose a school" }));
    await user.click(screen.getByRole("tab", { name: /^Graduate$/ }));
    await user.type(
      screen.getByPlaceholderText("Search name or abbreviation"),
      "GSAPS",
    );

    expect(screen.getByRole("status")).toHaveTextContent("1 school found");
    const options = within(screen.getByRole("listbox")).getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent(
      "Graduate School of Asia-Pacific Studies",
    );
  });

  it("combines education-level and program-language filters", async () => {
    const user = userEvent.setup();
    render(<SchoolSelector onChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Choose a school" }));
    await user.click(screen.getByRole("tab", { name: /^Undergraduate$/ }));
    await user.click(screen.getByRole("button", { name: /^Japanese-taught$/ }));

    expect(screen.getByRole("status")).toHaveTextContent("7 schools found");
    expect(
      within(screen.getByRole("listbox")).getAllByRole("option"),
    ).toHaveLength(7);
  });

  it("supports arrow-key navigation and keyboard selection", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SchoolSelector onChange={onChange} />);

    const trigger = screen.getByRole("button", { name: "Choose a school" });
    await user.click(trigger);
    const search = screen.getByPlaceholderText("Search name or abbreviation");
    search.focus();

    await user.keyboard("{ArrowDown}");
    const options = within(screen.getByRole("listbox")).getAllByRole("option");
    expect(options[0]).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(options[1]).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith("ug-cse-en");
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("clears a selection and restores focus to the trigger", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SchoolSelector value="ug-pse-en" onChange={onChange} />);

    const trigger = screen.getByRole("button", {
      name: /Change school, currently School of Political Science/,
    });
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Clear selection" }));

    expect(onChange).toHaveBeenCalledWith("");
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("closes on the dialog cancel event and restores trigger focus", async () => {
    const user = userEvent.setup();
    render(<SchoolSelector onChange={vi.fn()} />);

    const trigger = screen.getByRole("button", { name: "Choose a school" });
    await user.click(trigger);
    const dialog = screen.getByRole("dialog");
    fireEvent(dialog, new Event("cancel", { cancelable: true }));

    await waitFor(() => {
      expect(dialog).not.toHaveAttribute("open");
      expect(trigger).toHaveFocus();
    });
  });
});
