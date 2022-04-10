export interface SearchUserDto {
  students: Student[];
}

interface Student {
  uuid: string;
  studentNo: number;
  name: string;
}
