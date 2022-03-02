export interface SearchUserDto {
  students: Student[];
}

interface Student {
  studentNo: number;
  name: string;
}
