import { Resolver, Query, Mutation, Args, Int } from "@nestjs/graphql";
import { SchoolsService } from "./schools.service";
import { CreateSchoolInput } from "./dto/input/create-school.input";
import { School } from "src/entities";
import { SchoolResponse } from "./dto/response-school";
import { AssignSchoolToUsersArgs } from "./dto/args/assign-users-to-school.args";
import { UpdateSchoolInput } from "./dto/input/update-school.input";
import { ArchiveArgs } from "./dto/input/archive.input";
import { AuthGuard } from "src/guards/auth.guard";
import { RoleGuard } from "src/guards/role.guard";
import { UseGuards } from "@nestjs/common";
import { Roles } from "../roles/roles.decorator";
import { Role } from "../roles/roles.enum";

@UseGuards(AuthGuard, RoleGuard)
@Resolver(() => School)
export class SchoolsResolver {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Roles(Role.SuperAdmin, Role.DistrictAdmin, Role.SchoolAdmin)
  @Mutation(() => SchoolResponse)
  async createSchool(
    @Args("createSchoolInput") createSchoolInput: CreateSchoolInput
  ) {
    const resp = await this.schoolsService.create(createSchoolInput);
    return resp;
  }

  @Roles(Role.SuperAdmin, Role.DistrictAdmin, Role.SchoolAdmin)
  @Query(() => SchoolResponse, { name: "schools", nullable: true })
  findAll(@Args("archive", { type: () => Boolean }) archive: boolean) {
    return this.schoolsService.findAll(archive);
  }

  @Roles(Role.SuperAdmin, Role.DistrictAdmin, Role.SchoolAdmin)
  @Query(() => SchoolResponse, { name: "school" })
  findOne(@Args("id", { type: () => Int }) id: number) {
    return this.schoolsService.findOne(id);
  }

  @Roles(Role.SuperAdmin, Role.DistrictAdmin, Role.SchoolAdmin)
  @Mutation(() => SchoolResponse)
  updateSchool(
    @Args("updateSchoolInput") updateSchoolInput: UpdateSchoolInput
  ) {
    return this.schoolsService.update(updateSchoolInput.id, updateSchoolInput);
  }

  @Roles(Role.SuperAdmin, Role.DistrictAdmin, Role.SchoolAdmin)
  @Mutation(() => SchoolResponse)
  removeSchool(@Args("id", { type: () => Int }) id: number) {
    return this.schoolsService.remove(id);
  }

  @Roles(Role.SuperAdmin, Role.DistrictAdmin, Role.SchoolAdmin)
  @Mutation(() => SchoolResponse)
  archiveSchool(@Args() archiveArgs: ArchiveArgs) {
    return this.schoolsService.archive(archiveArgs);
  }

  @Roles(Role.SuperAdmin, Role.DistrictAdmin, Role.SchoolAdmin)
  @Mutation(() => SchoolResponse)
  assignSchoolToUser(@Args() assignSchoolToUser: AssignSchoolToUsersArgs) {
    return this.schoolsService.assignUsers(
      assignSchoolToUser.schoolId,
      assignSchoolToUser
    );
  }
}
