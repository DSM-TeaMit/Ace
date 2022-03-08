export interface PendingProjectDto {
  count: number;
  projects: Project[];
}

export interface Project {
  projectName: string;
  projectType: 'PERS' | 'TEAM' | 'CLUB';
  reportType: 'PLAN' | 'REPORT';
  submittedAt: Date;
  thumbnailUrl: string;
  writer: {
    studentNo: number;
    name: string;
  };
}
