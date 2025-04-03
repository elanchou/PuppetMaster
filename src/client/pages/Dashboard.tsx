import React from 'react';
import {
  Box,
  Grid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardBody,
  Heading,
  SimpleGrid,
} from '@chakra-ui/react';

const Dashboard: React.FC = () => {
  return (
    <Box>
      <Heading mb={6}>仪表盘</Heading>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>总任务数</StatLabel>
              <StatNumber>42</StatNumber>
              <StatHelpText>过去30天</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>成功率</StatLabel>
              <StatNumber>95%</StatNumber>
              <StatHelpText>↑ 5%</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>活跃实例</StatLabel>
              <StatNumber>8</StatNumber>
              <StatHelpText>当前运行中</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>平均执行时间</StatLabel>
              <StatNumber>2.5m</StatNumber>
              <StatHelpText>每个任务</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6} mt={8}>
        <Card>
          <CardBody>
            <Heading size="md" mb={4}>最近执行记录</Heading>
            {/* 这里可以添加一个任务执行历史列表组件 */}
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Heading size="md" mb={4}>系统状态</Heading>
            {/* 这里可以添加系统资源使用情况组件 */}
          </CardBody>
        </Card>
      </Grid>
    </Box>
  );
};

export default Dashboard; 