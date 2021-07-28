import { isEqual } from "lodash";
import { useState, useEffect } from "react";
import { useGetQuestionsLazyQuery } from "../generated/graphql";

export interface Filters {
  grade: number;
  subject: number;
  domain: number;
  tag: number;
  keyword: string;
}

const initialValues = {
  grade: null,
  subject: null,
  domain: null,
  tag: null,
  keyword: "",
};

export const useQuestionBankHook = () => {
  const [page, setPage] = useState<number>(0);
  const [count, setCount] = useState<number>(0);
  const [keyword, setKeyword] = useState<string>("");
  const [showBank, setShowBank] = useState(false);
  const [filters, setFilters] = useState<Filters>(initialValues);
  const [questions, setQuestions] = useState([]);
  const [getQuestions, { data, fetchMore }] = useGetQuestionsLazyQuery({
    fetchPolicy: "network-only",
  });

  const getMoreQuestions = async (p) => {
    setPage(p);
    const response: any = await fetchMore({
      variables: { page: p + 1, ...filters },
    });
    if (response.data.questions) {
      setQuestions(response.data.questions.questions);
    }
  };

  const setFilterValues = async (f, fetch = false) => {
    const newFilters = { ...filters, ...f };
    setFilters(() => newFilters);
    if (fetch) {
      setShowBank(true);
      getQuestions({
        variables: {
          ...newFilters,
          tags: newFilters.tag,
          domains: newFilters.domain,
          page: 1,
        },
      });
    }
  };

  const setInitialFilterValues = async (f) => {
    const newFilters = { ...filters, ...f };
    setFilters(() => newFilters);
  };

  useEffect(() => {
    if (data) {
      setQuestions(data.questions.questions);
      setCount(data.questions.count);
    }
  }, [data]);

  useEffect(() => {
    if (showBank) {
      getQuestions({ variables: { ...filters, keyword: keyword, page: 1 } });
    }
  }, [showBank]);

  return {
    setFilterValues,
    questions,
    filters,
    keyword,
    getMoreQuestions,
    setKeyword,
    getQuestions,
    showBank,
    setShowBank,
    setInitialFilterValues,
    page,
    count,
  };
};
