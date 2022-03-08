export interface FeedResponseDto {
  count: number;
  projects: Project[];
}

interface Project {
  thumbnailUrl: string;
  emoji: string;
  uuid: string;
  projectName: string;
  projectType: 'PERS' | 'TEAM' | 'CLUB';
  projectField: string;
  viewCount: number;
}
