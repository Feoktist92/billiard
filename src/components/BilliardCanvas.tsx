import React, { useState, useRef, useEffect, useCallback } from 'react';
import ColorPickerModal from './ColorPickerModal';

interface Ball {
    x: number;
    y: number;
    radius: number;
    color: string;
    vx: number;
    vy: number;
}

// Коэффициент отражения для расчета столкновений мячей
const coefficientOfRestitution = 0.3;

const BilliardCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [balls, setBalls] = useState<Ball[]>([
        { x: 100, y: 100, radius: 20, color: '#ff0000', vx: 0, vy: 0 },
        { x: 500, y: 200, radius: 20, color: '#00ff00', vx: 0, vy: 0 },
    ]);
    const [activeBall, setActiveBall] = useState<Ball | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mouseDownPosition, setMouseDownPosition] = useState<{
        x: number;
        y: number;
    } | null>(null);
    const animationFrameIdRef = useRef<number | null>(null);

    // Функция для отрисовки шаров на холсте
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);

        let updatedBalls = updateBallsPosition(balls, canvas);
        updatedBalls = resolveCollisions(updatedBalls);
        setBalls(updatedBalls);

        updatedBalls.forEach(drawBall.bind(null, ctx));

        animationFrameIdRef.current = requestAnimationFrame(draw);
    }, [balls]);

    // Функция для обновления позиций шаров
    const updateBallsPosition = (balls: Ball[], canvas: HTMLCanvasElement) => {
        return balls.map((ball) => {
            ball.x += ball.vx;
            ball.y += ball.vy;

            // Обработка столкновений с границами холста
            if (
                ball.x - ball.radius < 0 ||
                ball.x + ball.radius > canvas.width
            ) {
                ball.vx = -coefficientOfRestitution * ball.vx;
                ball.x = Math.max(
                    ball.radius,
                    Math.min(canvas.width - ball.radius, ball.x)
                );
            }
            if (
                ball.y - ball.radius < 0 ||
                ball.y + ball.radius > canvas.height
            ) {
                ball.vy = -coefficientOfRestitution * ball.vy;
                ball.y = Math.max(
                    ball.radius,
                    Math.min(canvas.height - ball.radius, ball.y)
                );
            }

            return ball;
        });
    };

    // Функция для обработки столкновений между шарами
    const resolveCollisions = (balls: Ball[]) => {
        for (let i = 0; i < balls.length; i++) {
            for (let j = i + 1; j < balls.length; j++) {
                const ball1 = balls[i];
                const ball2 = balls[j];
                const dx = ball2.x - ball1.x;
                const dy = ball2.y - ball1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDistance = ball1.radius + ball2.radius;

                if (distance < minDistance) {
                    const angle = Math.atan2(dy, dx);
                    const relativeVelocity = {
                        x: ball2.vx - ball1.vx,
                        y: ball2.vy - ball1.vy,
                    };
                    const relativeSpeed = Math.sqrt(
                        relativeVelocity.x * relativeVelocity.x +
                            relativeVelocity.y * relativeVelocity.y
                    );
                    const impulse = coefficientOfRestitution * relativeSpeed;

                    const impulseX =
                        impulse *
                        Math.cos(angle) *
                        (ball1.radius / (ball1.radius + ball2.radius));
                    const impulseY =
                        impulse *
                        Math.sin(angle) *
                        (ball1.radius / (ball1.radius + ball2.radius));

                    ball1.vx -= impulseX;
                    ball1.vy -= impulseY;
                    ball2.vx += impulseX;
                    ball2.vy += impulseY;
                }
            }
        }
        return balls;
    };

    // Функция для отрисовки одного шара
    const drawBall = (ctx: CanvasRenderingContext2D, ball: Ball) => {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.fill();
        ctx.closePath();
    };

    // Обработчик двойного клика по шару
    const handleDoubleClick = useCallback(
        (e: MouseEvent) => {
            const rect = canvasRef.current!.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const ball = balls.find(
                (ball) => Math.hypot(x - ball.x, y - ball.y) <= ball.radius
            );
            if (ball) {
                setActiveBall(ball);
                setIsModalOpen(true);
            }
        },
        [balls]
    );
    // Обработчик нажатия мыши на шарик
    const handleMouseDown = useCallback(
        (e: MouseEvent) => {
            const rect = canvasRef.current!.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const ball = balls.find(
                (ball) => Math.hypot(x - ball.x, y - ball.y) <= ball.radius
            );
            if (ball) {
                setActiveBall(ball);
                setMouseDownPosition({ x, y });
            }
        },
        [balls]
    );
    // Обработчик движения мыши при нажатии на шар
    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!activeBall || !mouseDownPosition) return;
            const rect = canvasRef.current!.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const dx = x - mouseDownPosition.x;
            const dy = y - mouseDownPosition.y;
            const force = Math.sqrt(dx * dx + dy * dy);
            const direction = Math.atan2(dy, dx);

            const maxSpeed = 10;

            activeBall.vx = Math.min(force, maxSpeed) * Math.cos(direction);
            activeBall.vy = Math.min(force, maxSpeed) * Math.sin(direction);

            setBalls((prevBalls) =>
                prevBalls.map((ball) =>
                    ball === activeBall ? { ...activeBall } : ball
                )
            );
        },
        [activeBall, mouseDownPosition]
    );
    // Обработчик отпускания кнопки мыши
    const handleMouseUp = useCallback(() => {
        setActiveBall(null);
        setMouseDownPosition(null);
    }, []);

    // Инициализация холста и слушателей событий
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.addEventListener('dblclick', handleDoubleClick);
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);

        return () => {
            canvas.removeEventListener('dblclick', handleDoubleClick);
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleDoubleClick, handleMouseDown, handleMouseMove, handleMouseUp]);

    // Отрисовка шаров на холсте
    useEffect(() => {
        animationFrameIdRef.current = requestAnimationFrame(draw);

        return () => {
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
            }
        };
    }, [draw]);

    // Обработчик изменения цвета шара
    const handleColorChange = (color: string) => {
        if (activeBall) {
            const updatedBall = { ...activeBall, color };
            setBalls((prevBalls) =>
                prevBalls.map((ball) =>
                    ball === activeBall ? updatedBall : ball
                )
            );
            setIsModalOpen(false);
        }
    };

    return (
        <div className='billiard-canvas'>
            <canvas
                ref={canvasRef}
                width={900}
                height={500}
                className='canvas'
            />
            <ColorPickerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onColorChange={handleColorChange}
            />
            <p style={{ textAlign: 'center', userSelect: 'none' }}>
                Кликните дважды, чтобы изменить цвет шара
            </p>
        </div>
    );
};

export default BilliardCanvas;
