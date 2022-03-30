export interface GetProjectResponseDto {
  uuid: string;
  projectName: string;
  projectDescription: string;
  projectView: number;
  projectType: 'PERS' | 'TEAM' | 'CLUB';
  projectField: string;
  projectStatus: string;
  projectResult: string;
  thumbnailUrl: string;
  emoji: string;
  requestorType: 'USER_NON_EDITABLE' | 'USER_EDITABLE' | 'ADMIN';
  members: Member[];
}

interface Member {
  thumbnailUrl?: string;
  uuid: string;
  studentNo: number;
  name: string;
  role: string;
}
