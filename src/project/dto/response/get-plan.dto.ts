export interface GetPlanResponseDto {
  projectName: string;
  projectType: 'PERS' | 'TEAM' | 'CLUB';
  startDate: string;
  endDate: string;
  requestorType: 'USER_NON_EDITABLE' | 'USER_EDITABLE' | 'ADMIN';
  writer: Omit<Member, 'role'>;
  members: Member[];
  goal: string;
  content: string;
  includes: Inclusion;
}

interface Member {
  studentNo: number;
  name: string;
  role: string;
}

interface Inclusion {
  report: boolean;
  code: boolean;
  outcome: boolean;
  others?: string;
}
