import React from 'react';
import styled from 'styled-components';

const GlassCard = ({ children, onClick }) => {
  return (
    <StyledWrapper onClick={onClick}>
      <div className="card">
        {children ?? 'Click me'}
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .card {
    box-sizing: border-box;
    width: 190px;
    height: 254px;
    background: rgba(217, 217, 217, 0.58);
    border: 1px solid white;
    box-shadow: 12px 17px 51px rgba(0, 0, 0, 0.22);
    backdrop-filter: blur(6px);
    border-radius: 17px;
    text-align: center;
    cursor: pointer;
    transition: all 0.5s;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
    font-weight: bolder;
    color: black;
    margin-inline: auto; /* center within grid column */
    padding: 1rem; /* allow inner content breathing room */
  }

  .card:hover {
    border: 1px solid black;
    transform: scale(1.05);
  }

  .card:active {
    transform: scale(0.95) rotateZ(1.7deg);
  }
`;

export default GlassCard;
