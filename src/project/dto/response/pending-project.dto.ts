export interface PendingProjectDto {
  count: number;
  projects: Project[];
}

export interface Project {
  projectName: string;
  projectType: 'PERS' | 'TEAM' | 'CLUB';
  reportType: 'PLAN' | 'REPORT';
  submittedAt: Date;
  writer: {
    studentNo: number;
    name: string;
  };
}
