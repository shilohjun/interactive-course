import type { ComponentType } from "react";
import { ApproxLinear } from "../explorables/approx-linear/ApproxLinear";

export const EXPLORABLES: Record<string, ComponentType> = {
  "approx-linear": ApproxLinear,
};
