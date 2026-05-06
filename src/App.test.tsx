import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders the Chinese empty state", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Trip Trace" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "创建第一趟旅行" })).toBeInTheDocument();
  });
});
