export interface PendingProjectDto {
  count: number;
  reports: Project[];
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
