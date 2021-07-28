import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { INTERNAL_SERVER_ERROR, NOT_FOUND, SCHOOL_EXISTS } from "src/constants";
import { School, User, UserType } from "src/entities";
import { In, IsNull, Not, Raw, Repository } from "typeorm";
import { CreateSchoolInput } from "./dto/input/create-school.input";
import { SchoolResponse } from "./dto/response-school";
import { AssignSchoolToUsersArgs } from "./dto/args/assign-users-to-school.args";
import { UpdateSchoolInput } from "./dto/input/update-school.input";
import { SchoolDtoMapper } from "./dto/mappers/school.map";
import { internalError } from "src/functions";
import { ArchiveArgs } from "./dto/input/archive.input";
@Injectable()
export class SchoolsService {
  constructor(
    @InjectRepository(School) readonly repo: Repository<School>,
    @InjectRepository(User) readonly userRepo: Repository<User>,
    @InjectRepository(UserType) readonly userTypeRepo: Repository<UserType>
  ) {}
  async create(createSchoolInput: CreateSchoolInput): Promise<SchoolResponse> {
    try {
      const school = this.repo.create({ ...createSchoolInput });
      await school.save();
      return { school };
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        return internalError("School");
      }
    }
    return internalError("School");
  }

  async findAll(archive: boolean): Promise<SchoolResponse> {
    try {
      const where = {};
      where["archivedAt"] = IsNull();
      if (archive) {
        where["archivedAt"] = Not(IsNull());
      }
      const schools = await this.repo.find({
        where,
        relations: ["district", "users", "users.userType"],
      });
      const data = schools.map((school) => SchoolDtoMapper(school));
      return { schools: data };
    } catch (error) {
      console.log("error: ", error);
      return internalError("School");
    }
  }

  async findOne(id: number): Promise<SchoolResponse> {
    try {
      const school = await this.repo.findOneOrFail({
        where: { archivedAt: IsNull(), id },
        relations: ["district", "users", "users.userType"],
      });
      return { school: SchoolDtoMapper(school) };
    } catch (error) {
      console.log("error: ", error);

      return internalError("School");
    }
  }

  async update(
    id: number,
    updateSchoolInput: UpdateSchoolInput
  ): Promise<SchoolResponse> {
    try {
      const school = await this.repo.findOne({
        where: { archivedAt: null, id },
      });
      if (!school) {
        return {
          error: [{ field: "id", message: NOT_FOUND }],
        };
      }
      const { name, districtsId, address } = updateSchoolInput;
      school.name = name;
      school.districtsId = districtsId;
      school.address = address;
      await school.save();
      return { school };
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        return internalError("name", SCHOOL_EXISTS);
      }
    }
    return internalError("School");
  }

  async remove(id: number): Promise<SchoolResponse> {
    try {
      const school = await this.repo.findOneOrFail({ id });
      await this.repo.softDelete(school);
      return { school };
    } catch (error) {
      return {
        error: [{ field: "school", message: INTERNAL_SERVER_ERROR }],
      };
    }
  }

  async assignUsers(
    id: number,
    schoolUserArgs: AssignSchoolToUsersArgs
  ): Promise<SchoolResponse> {
    try {
      const { users } = schoolUserArgs;
      const school = await this.repo.findOneOrFail({
        where: { id },
        relations: ["users"],
      });
      if (users.length <= 0) {
        school.users = [];
      } else {
        const userInfo = await this.userRepo.find({ where: { id: In(users) } });
        school.users = userInfo;
      }
      const data = await school.save();
      return { school: data };
    } catch (error) {
      return {
        error: [{ field: "school_user", message: INTERNAL_SERVER_ERROR }],
      };
    }
  }

  async archive(archiveArgs: ArchiveArgs): Promise<SchoolResponse> {
    try {
      const { id, status } = archiveArgs;
      const school = await this.repo.findOneOrFail({ id });
      school.archivedAt = status ? new Date() : null;
      await school.save();
      return { school };
    } catch (error) {
      return {
        error: [{ field: "school", message: INTERNAL_SERVER_ERROR }],
      };
    }
  }
}
