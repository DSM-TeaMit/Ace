export interface ProfileMainResponseDto {
  studentNo: number;
  name: string;
  email: string;
  githubId?: string;
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
  thumbnailUrl?: string;
}

export interface Project {
  uuid: string;
  projectName: string;
  projectDescription?: string;
  projectType: string;
  fields: string;
  members: Member[];
}

interface Member {
  uuid: string;
  name: string;
  thumbnailUrl?: string;
}
