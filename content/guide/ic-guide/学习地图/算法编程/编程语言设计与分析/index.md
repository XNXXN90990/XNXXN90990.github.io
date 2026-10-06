# 编程语言设计与分析

编程语言设计与分析(PL)研究**编程语言的语义、类型系统、程序分析与变换**。它和“编译原理”互补:编译原理偏工程实现(词法、语法、IR、代码生成),PL 偏理论(类型论、形式语义、程序证明)。

对硬件研究者来说,PL 是**做现代编译器(LLVM/MLIR/TVM)、形式验证、硬件描述语言研究**的理论基础。如果有意做 EDA 中的逻辑综合、形式等价性检查,或做 AI 编译器,PL 知识能看懂论文中的数学符号。

```mermaid
graph LR
    A["数据结构与算法"]:::beginner --> B["NJU 软件分析"]:::intermediate
    A --> C["北京大学 软件分析技术"]:::advanced
    B -. "进阶" .-> C
    classDef beginner fill:#EFF6FF,stroke:#3B82F6,color:#1E40AF
    classDef intermediate fill:#F0FDF4,stroke:#16A34A,color:#14532D
    classDef advanced fill:#F8FAFC,stroke:#64748B,color:#1E293B
```

## 相关科研方向

- [处理器架构与编译系统](/guide/ic-guide/%E7%A7%91%E7%A0%94%E6%96%B9%E5%90%91/%E5%A4%84%E7%90%86%E5%99%A8%E6%9E%B6%E6%9E%84%E4%B8%8E%E7%BC%96%E8%AF%91%E7%B3%BB%E7%BB%9F)
- [硬件安全与可信计算](/guide/ic-guide/%E7%A7%91%E7%A0%94%E6%96%B9%E5%90%91/%E7%A1%AC%E4%BB%B6%E5%AE%89%E5%85%A8%E4%B8%8E%E5%8F%AF%E4%BF%A1%E8%AE%A1%E7%AE%97)
- [EDA 与设计自动化](/guide/ic-guide/%E7%A7%91%E7%A0%94%E6%96%B9%E5%90%91/EDA%E4%B8%8E%E8%AE%BE%E8%AE%A1%E8%87%AA%E5%8A%A8%E5%8C%96)

