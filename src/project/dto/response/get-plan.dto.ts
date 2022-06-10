import { Exclude, Expose } from 'class-transformer';
import { RequestorType, DocumentStatus } from 'src/project/types';
import { Plan } from 'src/shared/entities/plan/plan.entity';

export class GetPlanResponseDto implements PlanResponse {
  @Exclude() private _plan: Plan;
  @Exclude() private _requestorType: RequestorType;
  @Exclude() private _status: DocumentStatus;

  constructor(
    plan: Plan,
    requestorType: RequestorType,
    status: DocumentStatus,
  ) {
    this._plan = plan;
    this._requestorType = requestorType;
    this._status = status;
  }

  @Expose()
  get projectName() {
    return this._plan.project.name;
  }

  @Expose()
  get projectType() {
    return this._plan.project.type;
  }

  @Expose()
  get startDate() {
    return this._plan.startDate;
  }

  @Expose()
  get endDate() {
    return this._plan.endDate;
  }

  @Expose()
  get requestorType() {
    return this._requestorType;
  }

  @Expose()
  get status() {
    return this._status;
  }

  @Expose()
  get writer() {
    return {
      studentNo: this._plan.project.writer.studentNo,
      name: this._plan.project.writer.name,
    };
  }

  @Expose()
  get members(): Member[] {
    return this._plan.project.members.map((member) => ({
      studentNo: member.studentNo,
      name: member.user.name,
      role: member.role,
    }));
  }

  @Expose()
  get goal() {
    return this._plan.goal;
  }

  @Expose()
  get content() {
    return this._plan.content;
  }

  @Expose()
  get includes(): Inclusion {
    return {
      report: this._plan.includeResultReport,
      code: this._plan.includeCode,
      outcome: this._plan.includeOutcome,
      others: this._plan.includeOthers,
    };
  }
}

interface PlanResponse {
  projectName: string;
  projectType: 'PERS' | 'TEAM' | 'CLUB';
  startDate: string;
  endDate: string;
  requestorType: 'USER_NON_EDITABLE' | 'USER_EDITABLE' | 'ADMIN';
  status: 'NOT_SUBMITTED' | 'PENDING' | 'ACCEPTED' | 'REJECTED';
  writer: Omit<Member, 'role'>;
  members: Member[];
  goal: string;
  content: string;
  includes: Inclusion;
}

interface Member {
  studentNo: number;
  name: string;
  role: string;
}

interface Inclusion {
  report: boolean;
  code: boolean;
  outcome: boolean;
  others?: string;
}
