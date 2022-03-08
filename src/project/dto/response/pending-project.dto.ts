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
  thumbnailUrl: string;
  emoji: string;
  writer: {
    studentNo: number;
    name: string;
  };
}
