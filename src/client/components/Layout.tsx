import React from 'react';
import { Layout as AntLayout, Menu } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { HomeOutlined, BugOutlined, PlayCircleOutlined, SettingOutlined, HistoryOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const { Header, Content, Sider } = AntLayout;

const StyledLayout = styled(AntLayout)`
  min-height: 100vh;
`;

const StyledHeader = styled(Header)`
  background: #fff;
  padding: 0 24px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
`;

const Logo = styled.div`
  font-size: 20px;
  font-weight: bold;
  color: #1890ff;
`;

const StyledContent = styled(Content)`
  margin: 24px;
  background: #fff;
  border-radius: 4px;
`;

interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
}

export const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems: MenuItem[] = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '仪表盘'
    },
    {
      key: '/execution',
      icon: <PlayCircleOutlined />,
      label: '执行管理'
    },
    {
      key: '/recordings',
      icon: <HistoryOutlined />,
      label: '录制记录'
    },
    {
      key: '/error-corrector',
      icon: <BugOutlined />,
      label: '错误纠正'
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '系统设置'
    }
  ];

  return (
    <StyledLayout>
      <StyledHeader>
        <Logo>PuppetMaster</Logo>
      </StyledHeader>
      <AntLayout>
        <Sider width={200} theme="light">
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }: { key: string }) => navigate(key)}
            style={{ height: '100%', borderRight: 0 }}
          />
        </Sider>
        <StyledContent>
          <Outlet />
        </StyledContent>
      </AntLayout>
    </StyledLayout>
  );
}; 