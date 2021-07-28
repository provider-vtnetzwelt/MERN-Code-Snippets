import React, { useEffect, useState } from "react";

import {
  Wrapper,
  MainContainer,
  CheckboxLabel,
  CheckboxContainer,
  RightFilterWrap,
  LeftFilterWrap,
  IconWrapper,
  FilterSearchWrap,
  IconSearch,
  TopClassFilterWrap,
} from "./styled";
import Data from "./Data";
import { Checkbox } from "../../../ui-library";
import Input from "../../UI/Input";
import { Class as ClassInterface, User } from "../../../generated/graphql";
import { FaUserPlus } from "react-icons/fa";
import { useAppDispatch } from "../../../hooks/redux";
import { toggleRemoveModal } from "../../../store/reducers/classes/classesSlice";
import { useRemoveStudentFromClassMutation } from "../../../generated/graphql";
import { useToasts } from "react-toast-notifications";
import { startCase } from "lodash";
import { IoSearchSharp } from "react-icons/io5";
import { Select } from "../users/Select/Select";
interface Props {
  klass: ClassInterface;
  onSearch: any;
  setKeyword: any;
  keyword: string;
  keywordSearch: any;
}
const Classes: React.FC<Props> = ({
  klass,
  onSearch,
  setKeyword,
  keyword,
  keywordSearch,
}) => {
  const [page, setPage] = useState(0);
  const setPageAndGetData = (page: number) => {
    setPage(page);
    onSearch(page * 10);
  };

  const dispatch = useAppDispatch();

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectValue, setSelectValue] = useState(null);
  const [studentIds, selectStudentIds] = useState([]);
  const { addToast, removeAllToasts } = useToasts();

  const [removeUserMutation, { data, loading }] =
    useRemoveStudentFromClassMutation();

  const removeUser = (userIds, id) => {
    removeUserMutation({
      variables: {
        id,
        userIds,
      },
    }).then(() => {
      setPageAndGetData(page);
      dispatch(toggleRemoveModal(false));
    });
  };

  useEffect(() => {
    if (klass && klass.students) {
      const allStudentIds = klass.students.map((user: User) => user.id);
      selectStudentIds(allStudentIds);
    }
  }, [klass]);

  useEffect(() => {
    if (data?.removeStudentFromClass) {
      removeAllToasts();
      addToast("Student(s) removed from class successfully", {
        appearance: "success",
      });
    }
  }, [data]);

  useEffect(() => {
    if (selectedUsers?.length === 0) {
      setSelectValue(null);
    }
  }, [selectedUsers]);

  const handleChange = (selectedOption) => {
    if (selectedOption.value === "remove") {
      dispatch(toggleRemoveModal(true));
      setSelectValue(selectedOption);
    }
  };

  return (
    <Wrapper>
      <MainContainer>
        <TopClassFilterWrap>
          <LeftFilterWrap>
            <IconWrapper>
              <img src="/assets/school.svg" alt={`${klass?.school?.name}`} />
              {klass?.school?.name}
            </IconWrapper>
            <IconWrapper>
              <img
                src="/assets/teacher.svg"
                alt={`${startCase(klass?.teacher?.firstName)} ${startCase(
                  klass?.teacher?.lastName
                )}`}
              />
              {`${startCase(klass?.teacher?.firstName)} 
              ${startCase(klass?.teacher?.lastName)}`}
            </IconWrapper>
            <IconWrapper>
              <img src="/assets/grade.svg" alt={`${klass?.grade?.name}`} />
              {klass?.grade?.name}
            </IconWrapper>
            <IconWrapper>
              <img
                src="/assets/students.svg"
                alt={`${klass?.studentsCount} Student(s)`}
              />
              {klass?.studentsCount} Student(s)
            </IconWrapper>
          </LeftFilterWrap>
          <RightFilterWrap>
            <FilterSearchWrap>
              <IconSearch>
                <IoSearchSharp />
              </IconSearch>
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search keyword"
                onKeyDown={(e) => keywordSearch(e)}
                style={{ margin: 0 }}
              />
            </FilterSearchWrap>
            <CheckboxContainer style={{ margin: "0 16px" }}>
              <Checkbox
                onChange={null}
                disabled={true}
                checked={selectedUsers.length}
              />
              <CheckboxLabel>{selectedUsers.length}</CheckboxLabel>
            </CheckboxContainer>
            <div style={{ width: "190px" }}>
              <Select
                value={selectValue}
                className="CustomBoxSelect"
                isDisabled={!selectedUsers.length}
                options={[
                  {
                    label: "Remove from class",
                    value: "remove",
                    icon: <FaUserPlus />,
                  },
                ]}
                onChange={handleChange}
                placeholder="Choose actions"
              />
            </div>
          </RightFilterWrap>
        </TopClassFilterWrap>
        <Data
          loading={loading}
          klass={klass}
          setPageAndGetData={(page) => setPageAndGetData(page)}
          selectedUsers={selectedUsers}
          setSelectedUsers={(users) => setSelectedUsers(users)}
          studentIds={studentIds}
          removeUser={removeUser}
          page={page}
          setPage={(page) => setPage(page)}
        />
      </MainContainer>
    </Wrapper>
  );
};

export default Classes;
