export interface PendingProjectDto {
  count: number;
  projects: Project[];
}

export interface Project {
  uuid: string;
  projectName: string;
  projectType: 'PERS' | 'TEAM' | 'CLUB';
  reportType: 'PLAN' | 'REPORT';
  submittedAt: Date;
  writer: {
    studentNo: number;
    name: string;
  };
}
