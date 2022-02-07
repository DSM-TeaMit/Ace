export interface GetPlanResponseDto {
  projectName: string;
  startDate: string;
  endDate: string;
  writerId: string;
  goal: string;
  content: string;
  includes: Inclusion;
}

interface Inclusion {
  report: boolean;
  code: boolean;
  outcome: boolean;
  others?: string;
}
