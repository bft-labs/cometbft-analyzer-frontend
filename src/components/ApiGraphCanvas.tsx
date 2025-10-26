/**
 * @file ApiGraphCanvas.tsx
 * @description
 * 이 파일은 CometBFT 합의 과정의 시각화를 위한 React 컴포넌트를 정의합니다.
 * D3.js와 HTML Canvas를 사용하여 P2P 메시지(화살표)와 노드 상태 변경(점)을 시각적으로 표현합니다.
 * 사용자는 이 그래프를 통해 시간 경과에 따른 노드 간의 상호작용과 각 노드의 상태 변화를 직관적으로 파악할 수 있습니다.
 *
 * 주요 기능:
 * 1.  **데이터 시각화**: API로부터 받은 이벤트 데이터를 기반으로 노드와 이벤트(메시지, 상태 변경)를 캔버스에 렌더링합니다.
 * 2.  **상호작용**:
 *     -   **툴팁**: 마우스를 화살표나 점 위로 가져가면 상세 정보(이벤트 종류, 시간, 노드 등)를 보여줍니다.
 *     -   **브러싱**: 사용자가 캔버스에서 특정 시간 범위를 드래그하여 선택(브러싱)하면, 해당 시간대의 데이터만 필터링하여 부모 컴포넌트에 알립니다.
 * 3.  **필터링 연동**: 부모 컴포넌트에서 선택된 이벤트 유형(p2pEvents, steps)에 따라 표시되는 데이터를 동적으로 필터링합니다.
 * 4.  **반응형 디자인**: 브라우저 창 크기가 변경되면 캔버스 크기와 스케일을 자동으로 조절하여 다시 렌더링합니다.
 */
"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import * as d3 from "d3";
import { p2pEvents, stepColorMap } from "./ApiStepLegend";
/**
 * GraphCanvas 컴포넌트
 * @param {GraphCanvasProps} props - 컴포넌트 props
 * @returns {React.JSX.Element} 렌더링될 JSX 요소
 */
function GraphCanvas({
  data,
  onBrushSelect,
  selectedEvents,
  selectedSteps,
  onEventClick,
  selectedTableEvent,
  viewportStart,
  viewportEnd,
  zoomLevel,
}: GraphCanvasProps): React.JSX.Element {
  // DOM 요소에 대한 참조(ref)
  const canvasRef = useRef<HTMLCanvasElement | null>(null); // 캔버스 요소

  // 툴팁 상태 관리
  const [tooltip, setTooltip] = useState<{
    content: CanvasArrowData | StateChangePoint | null;
    position: { x: number; y: number };
  } | null>(null);

  // 그래프 여백 설정
  const [margin] = useState({ top: 50, right: 50, bottom: 50, left: 80 });

  // D3 스케일 및 캔버스 컨텍스트에 대한 참조
  const contextRef = useRef<CanvasRenderingContext2D | null>(null); // 캔버스 2D 렌더링 컨텍스트
  const xScaleRef = useRef<d3.ScaleLinear<number, number> | null>(null); // X축 스케일 (시간)
  const yScaleRef = useRef<d3.ScaleBand<string> | null>(null); // Y축 스케일 (노드)

  // 시각화할 데이터를 가공하여 저장하는 참조
  // raw data를 매번 계산하지 않고, data prop이 변경될 때만 계산하여 성능 최적화
  const arrowDataRef = useRef<CanvasArrowData[]>([]); // 메시지(send/receive)를 나타내는 화살표 데이터
  const pointDataRef = useRef<StateChangePoint[]>([]); // 상태 변경을 나타내는 점 데이터

  // 브러싱 상태 관리
  const [isBrushing, setIsBrushing] = useState(false); // 현재 브러싱 중인지 여부
  const [brushStart, setBrushStart] = useState<number | null>(null); // 브러싱 시작점의 X 좌표
  const [brushEnd, setBrushEnd] = useState<number | null>(null); // 브러싱 끝점의 X 좌표

  /**
   * @function drawAll
   * @description 캔버스의 모든 요소를 그리는 메인 렌더링 함수.
   * @param {CanvasArrowData | StateChangePoint | null} highlightObj - 강조해서 표시할 객체 (마우스 호버 시). null이면 강조 없음.
   */
  const drawAll = (highlightObj: CanvasArrowData | StateChangePoint | null): void => {
    const canvasEl = canvasRef.current;
    const context = contextRef.current;
    if (!canvasEl || !context) return;

    // DPI 스케일링 처리 (고해상도 디스플레이에서 선명하게 보이도록)
    const { width, height } = canvasEl.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 전체 캔버스 배경색으로 채우기 (margin 포함)
    context.fillStyle = "#2E364D";
    context.fillRect(0, 0, width, height);

    // 여백(margin) 적용
    context.translate(margin.left, margin.top);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xScale = xScaleRef.current;
    const yScale = yScaleRef.current;

    if (!xScale || !yScale) return;

    // 부모 컴포넌트에서 선택된 스텝만 필터링 + viewport 범위 필터링
    const [d0, d1] = xScale.domain();
    const scArr = pointDataRef.current.filter((pt) => {
      if (!selectedSteps.includes(pt.type || "")) return false;
      const tsMs = pt.timestamp instanceof Date ? pt.timestamp.getTime() : Number(pt.timestamp);
      return tsMs >= d0 && tsMs <= d1;
    });

    // proposeStep 이고 isOurTurn === true 인 지점에 세로선(점선) + 하단 라벨(블록넘버, 타임스탬프) 표시
    {
      context.save();
      context.strokeStyle = "#888";
      context.fillStyle = "#aaa";
      context.textAlign = "center";
      context.textBaseline = "top";
      context.font = "11px sans-serif";

      const visiblePropose = scArr.filter((sc) => {
        return sc.type === "proposeStep" && sc.isOurTurn;
      });

      // Show every 2nd block to reduce clutter
      visiblePropose
        .filter((_, index) => index % 2 === 0)
        .forEach((sc) => {
          const tsMs = sc.timestamp instanceof Date ? sc.timestamp.getTime() : Number(sc.timestamp);
          const x = xScale(tsMs);
          // 점선 설정
          context.setLineDash([5, 4]);
          context.lineWidth = 1;
          context.beginPath();
          context.moveTo(x, 0);
          context.lineTo(x, innerHeight);
          context.stroke();

          // 하단 라벨: 블록넘버와 밀리세컨드만 표시
          const heightLabel = sc.height ?? sc.currentHeight;
          const milliseconds = new Date(tsMs).getUTCMilliseconds();

          context.setLineDash([]); // 텍스트 그리기 전에 점선 해제
          context.font = "10px sans-serif"; // 글씨 크기 줄임

          if (heightLabel !== undefined) {
            // 블록넘버 (위쪽)
            context.fillText(`${heightLabel}`, x, innerHeight + 12);
            // 밀리세컨드 (아래쪽)
            context.fillText(`${milliseconds}ms`, x, innerHeight + 24);
          }
        });

      context.restore();
    }

    // 1. 노드 라인 및 레이블 그리기
    context.strokeStyle = "#555";
    context.fillStyle = "#ccc";
    context.textBaseline = "middle";
    context.textAlign = "right";

    const nodes = yScale.domain();
    nodes.forEach((nd) => {
      const yC = yScale(nd)! + yScale.bandwidth() / 2;
      context.beginPath();
      context.moveTo(0, yC);
      context.lineTo(innerWidth, yC);
      context.stroke(); // 노드별 수평선
      context.fillText(nd.slice(0, 6), -10, yC); // 노드 이름
    });

    // 2. P2P 메시지(화살표) 그리기
    // 부모 컴포넌트에서 선택된 이벤트 유형에 해당하는 `type`들을 Set으로 만들어 필터링 성능을 최적화합니다.
    const selectedMsgTypes = new Set(
      p2pEvents.filter((event) => selectedEvents.includes(event.label)).map((event) => event.type)
    );

    // console.log(selectedMsgTypes);
    // console.log(arrowDataRef.current);
    const arrowArr = arrowDataRef.current.filter((ar) => {
      if (!selectedMsgTypes.has(ar.type)) return false;
      // Only render arrows that are at least partially within viewport time range
      return ar.sendTime <= d1 && ar.recvTime >= d0;
    });

    arrowArr.forEach((ar) => {
      const isHighlight = highlightObj === ar;
      // 테이블에서 선택된 이벤트와 매칭되는지 확인 (정확한 객체 매칭)
      const matchingCanvasEvent =
        selectedTableEvent &&
        data.find(
          (event) =>
            event === selectedTableEvent ||
            (event.type === selectedTableEvent.type &&
              event.timestamp.getTime() === selectedTableEvent.timestamp.getTime() &&
              event.nodeId === selectedTableEvent.nodeId)
        );
      const isSelectedFromTable =
        matchingCanvasEvent &&
        matchingCanvasEvent.type === ar.type &&
        Math.abs(matchingCanvasEvent.timestamp.getTime() - ar.timestamp.getTime()) < 50;

      let arrowColor = "#65AFFF"; // 기본 색상
      const matchedEvent = p2pEvents.find((event) => event.type === ar.type);
      if (matchedEvent) {
        arrowColor = matchedEvent.color;
      }
      if (isHighlight) arrowColor = "#ff9800"; // 마우스 호버 시 오렌지색
      if (isSelectedFromTable) arrowColor = "#00ff00"; // 테이블 선택 시 녹색

      const x1 = xScale(ar.sendTime);
      const x2 = xScale(ar.recvTime);
      const y1 = yScale(ar.fromNode)! + yScale.bandwidth() / 2;
      const y2 = yScale(ar.toNode)! + yScale.bandwidth() / 2;

      // 화살표 선 그라데이션 설정
      const gradient = context.createLinearGradient(x2, y2, x1, y1); // 머리(x2,y2)에서 꼬리(x1,y1) 방향으로 그라데이션
      gradient.addColorStop(0, arrowColor); // 머리 부분은 불투명
      gradient.addColorStop(1, arrowColor + "00"); // 꼬리 부분은 투명

      context.strokeStyle = gradient; // 선 색상을 그라데이션으로 설정
      context.fillStyle = arrowColor; // 화살표 머리 색상은 기존대로 유지
      context.lineWidth = 2; // 화살표 선 두께 설정

      // 화살표 선
      context.beginPath();
      context.moveTo(x1, y1);
      context.lineTo(x2, y2);
      context.stroke();

      // 화살표 머리 그리기
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len >= 1) {
        const arrowSize = 4; // 화살표 머리 크기 (높이)
        const angle = Math.PI / 3; // 화살표 머리 각도 (너비)
        const bx = x2 - (dx / len) * arrowSize;
        const by = y2 - (dy / len) * arrowSize;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const leftX = bx + (-(dx / len) * cos + -(dy / len) * sin) * arrowSize;
        const leftY = by + ((dx / len) * sin + -(dy / len) * cos) * arrowSize;
        const rightX = bx + (-(dx / len) * cos - -(dy / len) * sin) * arrowSize;
        const rightY = by + (-(dx / len) * sin - (dy / len) * cos) * arrowSize;
        context.beginPath();
        context.moveTo(x2, y2);
        context.lineTo(leftX, leftY);
        context.lineTo(rightX, rightY);
        context.closePath();
        context.fill();
      }
    });

    // 3. 상태 변경(점) 그리기
    scArr.forEach((pt) => {
      const isHighlight = highlightObj === pt;
      // 테이블에서 선택된 이벤트와 매칭되는지 확인 (정확한 객체 매칭)
      const matchingCanvasEvent =
        selectedTableEvent &&
        data.find(
          (event) =>
            event === selectedTableEvent ||
            (event.type === selectedTableEvent.type &&
              event.timestamp.getTime() === selectedTableEvent.timestamp.getTime() &&
              event.nodeId === selectedTableEvent.nodeId)
        );
      const isSelectedFromTable =
        matchingCanvasEvent &&
        matchingCanvasEvent.type === pt.type &&
        Math.abs(matchingCanvasEvent.timestamp.getTime() - pt.timestamp.getTime()) < 50 &&
        matchingCanvasEvent.nodeId === pt.node;

      const current = pt.type ?? "";

      let color = "#cf6679"; // 기본 색상

      color = stepColorMap[current] || "#000000"; // 스텝별 색상 매핑

      if (isHighlight) color = "#ff9800"; // 마우스 호버 시 오렌지색
      if (isSelectedFromTable) color = "#00ff00"; // 테이블 선택 시 녹색

      const cx = xScale(pt.timestamp);
      const cy = yScale(pt.node)! + yScale.bandwidth() / 2;

      // isOurTurn이 true인 proposeStep의 경우 토성 모양으로, 아니면 일반 점으로 렌더링
      if (pt.type === "proposeStep" && pt.isOurTurn) {
        // 토성 모양 렌더링
        // 1. 바깥쪽 링 그리기 (기존 점 지름과 동일)
        context.beginPath();
        context.arc(cx, cy, 6, 0, 2 * Math.PI);
        context.strokeStyle = color;
        context.lineWidth = 1.5; // 링 두께
        context.stroke();

        // 2. 안쪽 점 그리기 (링과 겹치지 않게 작게)
        context.beginPath();
        context.arc(cx, cy, 2.5, 0, 2 * Math.PI);
        context.fillStyle = color;
        context.fill();
      } else {
        // 일반 점 렌더링
        context.beginPath();
        context.arc(cx, cy, 6, 0, 2 * Math.PI); // 원으로 표시
        context.fillStyle = color;
        context.fill();
      }
    });

    // 4. 브러싱 영역 그리기
    if (isBrushing && brushStart !== null && brushEnd !== null) {
      const xMin = Math.min(brushStart, brushEnd);
      const xMax = Math.max(brushStart, brushEnd);
      context.save();
      context.fillStyle = "rgba(100, 100, 255, 0.3)"; // 반투명 파란색
      context.fillRect(xMin, 0, xMax - xMin, innerHeight);
      context.restore();
    }
  };

  /**
   * @function handleMouseMove
   * @description 마우스 이동 이벤트를 처리하여 툴팁 표시 및 브러싱을 업데이트.
   */
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - margin.left;
    const mouseY = e.clientY - rect.top - margin.top;

    // 브러싱 중일 경우, 브러시 끝점을 업데이트하고 다시 그림
    if (isBrushing) {
      setBrushEnd(mouseX);
      drawAll(null);
      return;
    }

    const xScale = xScaleRef.current;
    const yScale = yScaleRef.current;
    if (!xScale || !yScale) return;

    // 마우스 위치에서 가장 가까운 객체(화살표 또는 점) 찾기 (Hit Detection)
    let found: CanvasArrowData | StateChangePoint | null = null;
    let minDist = 10; // 10px 이내의 객체만 감지

    // 화살표와의 거리 계산
    const selectedMsgTypes = new Set(
      p2pEvents.filter((event) => selectedEvents.includes(event.label)).map((event) => event.type)
    );
    const [d0, d1] = xScale.domain();
    const arrs = arrowDataRef.current.filter((ar) => {
      if (!selectedMsgTypes.has(ar.type)) return false;
      // Only consider arrows that are at least partially within viewport time range
      return ar.sendTime <= d1 && ar.recvTime >= d0;
    });

    for (const ar of arrs) {
      const x1 = xScale(ar.sendTime);
      const x2 = xScale(ar.recvTime);
      const y1 = yScale(ar.fromNode)! + yScale.bandwidth() / 2;
      const y2 = yScale(ar.toNode)! + yScale.bandwidth() / 2;
      // 점과 선분 사이의 최단 거리 계산
      const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
      let t = ((mouseX - x1) * (x2 - x1) + (mouseY - y1) * (y2 - y1)) / l2;
      t = Math.max(0, Math.min(1, t));
      const cx = x1 + t * (x2 - x1);
      const cy = y1 + t * (y2 - y1);
      const dist = Math.sqrt((mouseX - cx) ** 2 + (mouseY - cy) ** 2);
      if (dist < minDist) {
        minDist = dist;
        found = ar;
      }
    }

    // 점과의 거리 계산 (더 가까운 점이 있으면 교체)
    if (!found) {
      const scArr = pointDataRef.current.filter((pt) => {
        if (!selectedSteps.includes(pt.type || "")) return false;
        const tsMs = pt.timestamp instanceof Date ? pt.timestamp.getTime() : Number(pt.timestamp);
        return tsMs >= d0 && tsMs <= d1;
      });

      for (const sc of scArr) {
        const dx = mouseX - xScale(sc.timestamp);
        const dy = mouseY - (yScale(sc.node)! + yScale.bandwidth() / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          found = sc;
        }
      }
    }

    // 툴팁 처리 - 고정 위치에 표시
    if (found) {
      setTooltip({ content: found, position: { x: 0, y: 0 } }); // position은 사용하지 않음
      drawAll(found); // 찾은 객체를 강조하여 다시 그림
    } else {
      setTooltip(null);
      drawAll(null);
    }
  };

  /**
   * @function handleMouseLeave
   * @description 마우스가 캔버스를 벗어났을 때 툴팁을 숨기고 브러싱을 취소.
   */
  const handleMouseLeave = (): void => {
    setTooltip(null);
    if (isBrushing) {
      setIsBrushing(false);
      setBrushStart(null);
      setBrushEnd(null);
    }
    drawAll(null);
  };

  /**
   * @function handleMouseDown
   * @description 마우스 버튼을 눌렀을 때 브러싱 시작.
   */
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - margin.left;
    setIsBrushing(true);
    setBrushStart(mouseX);
    setBrushEnd(mouseX);
  };

  /**
   * @function handleMouseUp
   * @description 마우스 버튼을 뗐을 때 브러싱 종료 및 선택된 범위 전달.
   */
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    if (!isBrushing) return;
    setIsBrushing(false);

    if (brushStart !== null && brushEnd !== null && brushStart !== brushEnd) {
      const xScale = xScaleRef.current;
      if (!xScale) return;
      const pixelMin = Math.min(brushStart, brushEnd);
      const pixelMax = Math.max(brushStart, brushEnd);
      // 픽셀 좌표를 D3 스케일의 역함수(invert)를 사용해 시간 값으로 변환
      const tMin = xScale.invert(pixelMin);
      const tMax = xScale.invert(pixelMax);

      // 부모 컴포넌트에 선택된 시간 범위 전달
      if (onBrushSelect) {
        onBrushSelect(Math.floor(tMin), Math.floor(tMax));
      }
    } else if (brushStart !== null && brushEnd !== null && Math.abs(brushStart - brushEnd) < 5) {
      // 단순 클릭 (드래그 거리가 5px 이하인 경우)
      handleCanvasClick(e);
    }

    // 브러싱 상태 초기화
    setBrushStart(null);
    setBrushEnd(null);
    drawAll(null);
  };

  /**
   * @function handleCanvasClick
   * @description 캔버스 클릭 이벤트 처리 - 클릭된 이벤트를 찾아서 부모에 전달
   */
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    if (!canvasRef.current || !onEventClick) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - margin.left;
    const mouseY = e.clientY - rect.top - margin.top;

    const xScale = xScaleRef.current;
    const yScale = yScaleRef.current;
    if (!xScale || !yScale) return;

    // 마우스 위치에서 가장 가까운 이벤트 찾기 (hit detection)
    let foundEvent: CanvasEvent | null = null;
    let minDist = 10; // 10px 이내의 객체만 감지

    // 먼저 step 이벤트들 확인
    const selectedStepTypes = new Set(selectedSteps);
    const [d0, d1] = xScale.domain();

    const stepEvents = pointDataRef.current.filter((step) => {
      if (!selectedStepTypes.has(step.type)) return false;
      const stepTime = step.timestamp.getTime();
      return stepTime >= d0 && stepTime <= d1;
    });

    for (const step of stepEvents) {
      const x = xScale(step.timestamp.getTime());
      const y = yScale(step.node)! + yScale.bandwidth() / 2;
      const dist = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2);
      if (dist < minDist) {
        minDist = dist;
        // step 이벤트를 CanvasEvent 형태로 변환
        const matchingCanvasEvent = data.find(
          (event) =>
            event.type === step.type &&
            Math.abs(event.timestamp.getTime() - step.timestamp.getTime()) < 1000 &&
            event.nodeId === step.node
        );
        if (matchingCanvasEvent) {
          foundEvent = matchingCanvasEvent;
        }
      }
    }

    // Arrow 이벤트들도 확인
    const selectedMsgTypes = new Set(
      p2pEvents.filter((event) => selectedEvents.includes(event.label)).map((event) => event.type)
    );

    const arrowEvents = arrowDataRef.current.filter((ar) => {
      if (!selectedMsgTypes.has(ar.type)) return false;
      return ar.sendTime <= d1 && ar.recvTime >= d0;
    });

    for (const ar of arrowEvents) {
      const x1 = xScale(ar.sendTime);
      const x2 = xScale(ar.recvTime);
      const y1 = yScale(ar.fromNode)! + yScale.bandwidth() / 2;
      const y2 = yScale(ar.toNode)! + yScale.bandwidth() / 2;

      // 점과 선분 사이의 최단 거리 계산
      const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
      let t = ((mouseX - x1) * (x2 - x1) + (mouseY - y1) * (y2 - y1)) / l2;
      t = Math.max(0, Math.min(1, t));
      const cx = x1 + t * (x2 - x1);
      const cy = y1 + t * (y2 - y1);
      const dist = Math.sqrt((mouseX - cx) ** 2 + (mouseY - cy) ** 2);

      if (dist < minDist) {
        minDist = dist;
        // arrow 이벤트를 CanvasEvent 형태로 변환
        const matchingCanvasEvent = data.find(
          (event) => event.type === ar.type && Math.abs(event.timestamp.getTime() - ar.timestamp.getTime()) < 1000
        );
        if (matchingCanvasEvent) {
          foundEvent = matchingCanvasEvent;
        }
      }
    }

    // 찾은 이벤트가 있으면 부모에게 전달
    if (foundEvent) {
      onEventClick(foundEvent);
    }
  };

  /**
   * @function onResize
   * @description 창 크기 변경 시 캔버스 크기를 재설정하고 스케일을 업데이트하는 콜백 함수.
   */
  const onResize = useCallback(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl || !data || data.length === 0) return;

    const context = canvasEl.getContext("2d");
    if (!context) return;
    contextRef.current = context;

    // 캔버스 크기 설정 (DPR 고려)
    const { width, height } = canvasEl.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvasEl.width = width * dpr;
    canvasEl.height = height * dpr;
    context.scale(dpr, dpr); // 컨텍스트 스케일 조정

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // X축 스케일(시간) 설정 - Go tool trace style viewport
    let xMin, xMax;
    if (viewportStart !== undefined && viewportEnd !== undefined) {
      // Use viewport range for go tool trace style
      xMin = viewportStart;
      xMax = viewportEnd;
    } else {
      // Fallback to data range
      const minTime = d3.min(data, (d) => new Date(d.timestamp).getTime()) ?? 0;
      const maxTime = d3.max(data, (d) => new Date(d.timestamp).getTime()) ?? 0;
      const domainPadding = 5;
      xMin = minTime - domainPadding;
      xMax = maxTime + domainPadding;
    }

    const xScale = d3.scaleLinear().domain([xMin, xMax]).range([0, innerWidth]);
    xScaleRef.current = xScale;

    // Y축 스케일(노드) 설정
    const nodeSet = new Set<string>();
    data.forEach((d) => {
      if (d.nodeId) nodeSet.add(d.nodeId);
      if ((d as any).senderPeerId) nodeSet.add((d as any).senderPeerId as string);
      if ((d as any).recipientPeerId) nodeSet.add((d as any).recipientPeerId as string);
      const asAny = d as any;
      const sourcePeer = asAny.sourcePeer as string | undefined;
      const recipientPeer = asAny.recipientPeer as string | undefined;
      if (sourcePeer) nodeSet.add(sourcePeer.includes("@") ? sourcePeer.split("@")[0] : sourcePeer);
      if (recipientPeer) nodeSet.add(recipientPeer.includes("@") ? recipientPeer.split("@")[0] : recipientPeer);
    });
    const nodes = Array.from(nodeSet).sort(); // 노드 ID를 정렬하여 일관된 순서 유지
    const yScale = d3.scaleBand<string>().domain(nodes).range([0, innerHeight]).padding(0.3);
    yScaleRef.current = yScale;

    drawAll(null); // 모든 요소를 다시 그림
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, margin]); // data나 margin이 바뀔 때만 함수가 재생성됨

  // 창 크기 변경 리스너 등록 및 해제
  useEffect(() => {
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [onResize]);

  // 데이터나 필터, 뷰포트가 변경될 때 캔버스를 다시 그림
  useEffect(() => {
    if (!data || data.length === 0) return;
    const animationFrameId = requestAnimationFrame(() => {
      onResize(); // 스케일을 다시 계산해야 할 수 있으므로 onResize 호출
      drawAll(null);
    });
    return () => cancelAnimationFrame(animationFrameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, onResize, selectedEvents, selectedSteps, selectedTableEvent, viewportStart, viewportEnd, zoomLevel]);

  /**
   * @effect
   * @description `data` prop이 변경될 때 실행.
   * Raw 이벤트 데이터를 시각화에 적합한 `arrows`와 `points` 형태로 가공하여 ref에 저장.
   * 이 과정을 통해 렌더링 시 매번 데이터를 계산하는 것을 방지.
   */
  useEffect(() => {
    if (!data || data.length === 0) return;

    // 1. 이벤트 유형별로 데이터 분리
    // Some backends use canonical types (e.g., "vote", "block_part") while others use
    // umbrella types ("p2pVote", "p2pBlockPart"). Detect P2P events by presence of
    // sender/receiver and timing fields rather than relying only on type string.
    const isP2PEvent = (d: CanvasEvent) =>
      !!(d.senderPeerId && d.nodeId && d.sentTime && d.receivedTime && (d.vote || d.part));

    const p2pEventData = data.filter((d) => (d.type === "p2pVote" || d.type === "p2pBlockPart") || isP2PEvent(d));
    const stateChanges = data.filter((d) => !p2pEventData.includes(d));

    // 2. 매칭된 송수신 기반 화살표와, 단일 레코드(p2p) 기반 화살표를 모두 생성
    const arrows: CanvasArrowData[] = [];

    // 2-a. 단일 레코드에 송수신 정보가 모두 있는 경우 (p2pVote / p2pBlockPart 등)
    p2pEventData.forEach((e) => {
      // p2p 이벤트에서 송신/수신 정보를 직접 추출합니다.
      // 필수 데이터 (송신자, 수신자, 송수신 시간)가 없으면 건너뜁니다.
      if (!e.senderPeerId || !e.nodeId || !e.sentTime || !e.receivedTime) {
        return; // 매칭 로직(2-b)에서 처리
      }

      let height: number | undefined;
      let msgType: string | undefined = e.type;
      let vote: CoreVote | undefined;
      let part: CorePart | undefined;

      // 이벤트 유형에 따라 메시지 타입과 높이를 결정합니다.
      if ((e.type === "p2pVote" || e.vote) && e.vote) {
        msgType = e.vote.type; // "prevote" 또는 "precommit"
        height = e.vote.height;
        vote = e.vote;
      } else if ((e.type === "p2pBlockPart" || e.part) && e.part) {
        msgType = "blockPart"; // StepLegend의 p2pEvents와 일치하는 타입
        height = e.height;
        part = e.part;
      }

      // 유효한 데이터가 있을 경우에만 화살표를 추가합니다.
      if (msgType && height !== undefined) {
        arrows.push({
          canvasType: "arrow",
          type: msgType, // 올바른 메시지 타입 할당
          fromNode: e.senderPeerId,
          toNode: e.nodeId,
          height: height,
          sendTime: new Date(e.sentTime).getTime(),
          recvTime: new Date(e.receivedTime).getTime(),
          latency: e.latency,
          timestamp: e.timestamp,
          vote: vote,
          part: part,
        });
      }
    });

    // 2-b. send/receive 쌍으로 주어지는 이벤트를 매칭하여 화살표 생성 (sendVote/receiveVote, block parts 등)
    const voteSends = data.filter((d) => d.type === "sendVote" && d.vote);
    const voteReceives = data.filter((d) => d.type === "receiveVote" && d.vote);

    type VoteKey = string;
    const makePeerId = (v: CanvasEvent): string | undefined => {
      const asAny = v as any;
      // normalize various field names
      const from = asAny.senderPeerId || asAny.sourcePeerId || asAny.sourcePeer;
      if (typeof from === "string") return from.includes("@") ? from.split("@")[0] : from;
      return undefined;
    };
    const makeRecipientId = (v: CanvasEvent): string | undefined => {
      const asAny = v as any;
      const to = asAny.recipientPeerId || asAny.recipientPeer;
      if (typeof to === "string") return to.includes("@") ? to.split("@")[0] : to;
      return undefined;
    };
    const voteKey = (from: string | undefined, to: string | undefined, v: CanvasEvent): VoteKey | undefined => {
      if (!v.vote) return undefined;
      const { type, height, round, blockId } = v.vote;
      if (!from || !to || !type || height === undefined || round === undefined || !blockId?.hash) return undefined;
      return [from, to, type, height, round, blockId.hash].join("|");
    };

    const receiveIndex = new Map<VoteKey, CanvasEvent[]>();
    voteReceives.forEach((r) => {
      const from = makePeerId(r) || (r as any).senderPeerId || "";
      const to = r.nodeId;
      const key = voteKey(from, to, r);
      if (key) {
        if (!receiveIndex.has(key)) receiveIndex.set(key, []);
        receiveIndex.get(key)!.push(r);
      }
    });
    // Sort receives by time to pick the earliest after send
    receiveIndex.forEach((arr) => arr.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()));

    voteSends.forEach((s) => {
      const from = s.nodeId;
      const to = makeRecipientId(s);
      const key = voteKey(from, to, s);
      if (!key) return;
      const candidates = receiveIndex.get(key) || [];
      const sendTime = s.timestamp.getTime();
      const recv = candidates.find((r) => r.timestamp.getTime() >= sendTime);
      if (!recv) return;

      arrows.push({
        canvasType: "arrow",
        type: s.vote!.type, // prevote | precommit
        fromNode: from!,
        toNode: to!,
        height: s.vote!.height,
        sendTime,
        recvTime: recv.timestamp.getTime(),
        latency: recv.timestamp.getTime() - sendTime,
        timestamp: s.timestamp,
        vote: s.vote,
      });
    });

    // Block part send/receive matching
    const partSends = data.filter((d) => (d as any).part && (d.type === "sendBlockPart" || (d as any).recipientPeerId || (d as any).recipientPeer));
    const partReceives = data.filter((d) => (d as any).part && (d.type === "receiveBlockPart" || (d as any).senderPeerId || (d as any).sourcePeerId));

    type PartKey = string;
    const partKey = (from: string | undefined, to: string | undefined, v: CanvasEvent): PartKey | undefined => {
      const p: any = (v as any).part;
      const h = (v.height ?? (v as any).height) as number | undefined;
      const idx: number | undefined = p?.index ?? p?.proof?.index;
      if (!from || !to || h === undefined || idx === undefined) return undefined;
      return [from, to, h, idx].join("|");
    };

    const partReceiveIndex = new Map<PartKey, CanvasEvent[]>();
    partReceives.forEach((r) => {
      const from = makePeerId(r) || (r as any).senderPeerId || "";
      const to = r.nodeId;
      const key = partKey(from, to, r);
      if (key) {
        if (!partReceiveIndex.has(key)) partReceiveIndex.set(key, []);
        partReceiveIndex.get(key)!.push(r);
      }
    });
    partReceiveIndex.forEach((arr) => arr.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()));

    partSends.forEach((s) => {
      const from = s.nodeId;
      const to = makeRecipientId(s);
      const key = partKey(from, to, s);
      if (!key) return;
      const candidates = partReceiveIndex.get(key) || [];
      const sendTime = s.timestamp.getTime();
      const recv = candidates.find((r) => r.timestamp.getTime() >= sendTime);
      if (!recv) return;

      const part: any = (s as any).part;
      const h = (s.height ?? (s as any).height) as number | undefined;

      arrows.push({
        canvasType: "arrow",
        type: "blockPart",
        fromNode: from!,
        toNode: to!,
        height: h,
        sendTime,
        recvTime: recv.timestamp.getTime(),
        latency: recv.timestamp.getTime() - sendTime,
        timestamp: s.timestamp,
        part,
      });
    });

    const points: StateChangePoint[] = [];
    stateChanges.forEach((e) => {
      points.push({
        canvasType: "step",
        type: e.type,
        timestamp: e.timestamp,
        height: e.height,
        node: e.nodeId,
        round: e.round,
        isOurTurn: e.isOurTurn,
        duration: e.duration,

        proposal: e.proposal,
        proposer: e.proposer,
        currentHeight: e.currentHeight,
        currentRound: e.currentRound,
        currentStep: e.currentStep,
        step: e.step,
        nextStep: e.nextStep,
        nextHeight: e.nextHeight,
        hash: e.hash,
      });
    });

    // 가공된 데이터를 ref에 저장
    arrowDataRef.current = arrows;
    pointDataRef.current = points;
  }, [data]);

  // JSX 렌더링
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#2E364D",
          display: "block",
          borderRadius: "8px",
        }}
        // 마우스 이벤트 핸들러 등록
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      />
      {tooltip?.content && (
        <div
          className="absolute top-2 right-2 p-3 text-sm font-mono text-gray-200 bg-gray-800/95 border border-gray-600 rounded-lg shadow-lg pointer-events-none"
          style={{ zIndex: 1000, minWidth: "280px" }}
        >
          <div className="grid grid-cols-[120px,1fr] gap-x-3 gap-y-2 items-center">
            {tooltip.content.canvasType === "step" ? (
              <>
                <div className="col-span-2 pb-1 mb-2 font-bold text-sky-400 border-b border-gray-600">
                  {tooltip.content.type}
                </div>
                <div className="font-medium text-gray-400">Node</div>
                <div title={tooltip.content.node}>{tooltip.content.node}</div>
                <div className="font-medium text-gray-400">Time</div>
                <div>{new Date(tooltip.content.timestamp).toLocaleTimeString()}</div>
                <div className="font-medium text-gray-400">Timestamp</div>
                <div>{new Date(tooltip.content.timestamp).toISOString().substr(11, 12)}</div>
                <div className="font-medium text-gray-400">Height</div>
                <div>{tooltip.content.height}</div>
                <div className="font-medium text-gray-400">Round</div>
                <div>{tooltip.content.round}</div>
                {tooltip.content.isOurTurn !== undefined && (
                  <>
                    <div className="font-medium text-gray-400">Our Turn</div>
                    <div>{tooltip.content.isOurTurn ? "Yes" : "No"}</div>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="col-span-2 pb-1 mb-2 font-bold text-sky-400 border-b border-gray-600">
                  {tooltip.content.type}
                </div>
                <div className="font-medium text-gray-400">From</div>
                <div title={tooltip.content.fromNode}>{tooltip.content.fromNode}</div>
                <div className="font-medium text-gray-400">To</div>
                <div title={tooltip.content.toNode}>{tooltip.content.toNode}</div>
                <div className="font-medium text-gray-400">Send Time</div>
                <div>{new Date(tooltip.content.sendTime).toISOString().substr(11, 12)}</div>
                <div className="font-medium text-gray-400">Recv Time</div>
                <div>{new Date(tooltip.content.recvTime).toISOString().substr(11, 12)}</div>
                <div className="font-medium text-gray-400">Latency</div>
                <div>{((tooltip.content.latency ?? 0) / 1000000).toFixed(2)}ms</div>
                <div className="font-medium text-gray-400">Height</div>
                <div>{tooltip.content.height}</div>
                <div className="font-medium text-gray-400">Timestamp</div>
                <div>{new Date(tooltip.content.timestamp).toISOString().substr(11, 12)}</div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default GraphCanvas;
