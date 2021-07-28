import { useRouter } from "next/router";
import Head from "next/head";
import React, { useCallback, useEffect, useState } from "react";
import QuizCorrectAnswer from "../../../components/QuizCorrectAnswer";
import QuizWrongAnswer from "../../../components/QuizWrongAnswer";
import StudentQuizQuestion from "../../../components/StudentQuizQuestion";
import {
  useStudentQuizQuestionQuery,
  useSubmitAnswerMutation,
} from "../../../generated/graphql";
import { useAppSelector } from "../../../hooks/redux";
import { selectUser } from "../../../store/reducers/auth/authSelector";
import { selectQuizIntro } from "../../../store/reducers/quiz/quizSelector";
import Loader from "../../../components/UI/Loader";
import { NetworkStatus } from "@apollo/client";
import { useToasts } from "react-toast-notifications";

export async function getServerSideProps({ params }) {
  return {
    props: {
      url: params.url,
    },
  };
}

const Questions = ({ url }) => {
  const router = useRouter();
  const { removeAllToasts, addToast } = useToasts();

  // get quiz from store
  const quizIntro = useAppSelector(selectQuizIntro);

  const [quizQuestionResponse, setQuizQuestionResponse] = useState(null);
  const [answerResponse, setAnswerResponse] = useState(null);
  const [answer, setAnswer] = useState<Array<number>>([]);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [isQuizCompleted, setQuizCompleted] = useState(false);
  // get question
  const { data, loading, refetch, networkStatus } = useStudentQuizQuestionQuery(
    {
      variables: {
        sharableUrl: url as string,
      },
      notifyOnNetworkStatusChange: true,
      fetchPolicy: "no-cache",
    }
  );

  const user = useAppSelector(selectUser);
  const [submitAnswer] = useSubmitAnswerMutation();

  useEffect(() => {
    if (data && data.studentQuizQuestion?.question) {
      setQuizQuestionResponse(data.studentQuizQuestion);
    }
    if (data?.studentQuizQuestion?.error) {
      router.push(`/quiz/${url}/result`);
    }
  }, [data]);

  const onAnswerSelect = ($event) => {
    const val = parseInt($event.currentTarget.value);
    if ($event.currentTarget.checked) {
      quizQuestionResponse.question.questionType === "multiselect"
        ? setAnswer([...answer, val])
        : setAnswer([val]);
    } else {
      const index = answer.indexOf(val);
      if (index !== -1) {
        const cloned = [...answer];
        cloned.splice(index, 1);
        setAnswer(cloned);
      }
    }
  };
  // submit answer
  const onCheckAnswerClick = useCallback(async () => {
    setSubmittingAnswer(true);
    const { data, errors } = await submitAnswer({
      variables: {
        params: {
          question: quizQuestionResponse.question.id,
          assignedQuizId: quizQuestionResponse.quiz.assignedQuiz,
          answerOption: answer,
        },
      },
    });
    setSubmittingAnswer(false);
    if (errors) {
      removeAllToasts();
      return addToast(errors[0].message, { appearance: "error" });
    }
    if (data) {
      const { error, quizCompleted, ...answerResponse } = data.submitAnswer;
      if (error) {
        removeAllToasts();
        return addToast(error[0].message, { appearance: "error" });
      }
      setQuizCompleted(quizCompleted);
      setAnswerResponse(answerResponse);
      return;
    }
    removeAllToasts();
    return addToast("Could not complete request.", { appearance: "error" });
  }, [quizQuestionResponse, answer]);

  useEffect(() => {
    window.history.pushState(null, document.title, window.location.href);
    const removeHistory = (event) => {
      window.history.pushState(null, document.title, window.location.href);
      onCheckAnswerClick();
    };
    window.addEventListener("popstate", removeHistory);

    return () => {
      window.removeEventListener("popstate", removeHistory);
    };
  }, [onCheckAnswerClick]);

  const onNextQuestionClick = useCallback(() => {
    // call question query again and clear answer state
    setAnswer([]);
    setAnswerResponse(null);
    refetch();
  }, []);
  const headComponent = (
    <Head>
      <title>Kenect | {quizIntro?.title}</title>
    </Head>
  );
  if (answerResponse) {
    return (
      <>
        {headComponent}
        {answerResponse.isCorrectAnswer ? (
          <QuizCorrectAnswer
            currentUser={user}
            onNextQuestionClick={onNextQuestionClick}
            leaderBoard={answerResponse?.leaderBoard}
            quizPoints={answerResponse?.quizTotalPoints}
            quizQuestionResponse={quizQuestionResponse}
            quizCompleted={isQuizCompleted}
          />
        ) : (
          <QuizWrongAnswer
            quizQuestionResponse={quizQuestionResponse}
            answerResponse={answerResponse}
            onNextQuestionClick={onNextQuestionClick}
            currentUser={user}
            quizCompleted={isQuizCompleted}
          />
        )}
      </>
    );
  }

  if (networkStatus === NetworkStatus.refetch || loading) {
    return <Loader />;
  }

  return (
    <>
      {headComponent}
      <StudentQuizQuestion
        quizQuestionResponse={quizQuestionResponse}
        loading={loading}
        submittingAnswer={submittingAnswer}
        answer={answer}
        onAnswerSelect={onAnswerSelect}
        onCheckAnswerClick={onCheckAnswerClick}
        user={user}
      />
    </>
  );
};

export default Questions;
