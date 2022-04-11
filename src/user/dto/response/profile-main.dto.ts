export interface ProfileMainResponseDto {
  studentNo: number;
  name: string;
  email: string;
  githubId?: string;
  thumbnailUrl: string;
  pendingCount: number;
  pendingProjects?: PendingProject[];
  projectCount: number;
  projects: Project[];
}

export interface PendingProject {
  uuid: string;
  projectName: string;
  type: string;
  status: string;
  thumbnailUrl: string;
  emoji: string;
}

export interface Project {
  uuid: string;
  projectName: string;
  projectDescription?: string;
  projectType: string;
  fields: string;
  thumbnailUrl: string;
  emoji: string;
  members: Member[];
}

interface Member {
  uuid: string;
  name: string;
  thumbnailUrl?: string;
}
