export interface FeedResponseDto {
  count: number;
  projects: Project[];
}

interface Project {
  thumbnailUrl: string;
  projectName: string;
  projectType: 'PERS' | 'TEAM' | 'CLUB';
  projectField: string;
  viewCount: number;
}
