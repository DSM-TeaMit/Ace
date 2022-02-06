export interface GetProjectResponseDto {
  uuid: string;
  projectName: string;
  projectDescription: string;
  projectView: number;
  projectType: 'PERS' | 'TEAM' | 'CLUB';
  projectField: string;
  projectStatus: string;
  projectResult: string;
  comments: Comment[];
  members: Member[];
}

interface Comment {
  userUuid: string;
  thumbnailUrl: string;
  content: string;
}

interface Member {
  thumbnailUrl?: string;
  uuid: string;
  studentNo: number;
  name: string;
  role: string;
}
