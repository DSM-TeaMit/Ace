export interface ProfileMainResponseDto {
  studentNo: number;
  name: string;
  email: string;
  githubId?: string;
  projectCount: number;
  projects: Project[];
}

interface Project {
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
