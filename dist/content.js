import {expandedLessons} from './course-expanded.js';
export const stages = [
 {title:'建立直觉',sub:'让文字成为可以计算的表示',ids:[0,1,2],color:'lavender',icon:'layers'},
 {title:'拆解注意力',sub:'亲手走完一次信息聚合',ids:[3,4,5],color:'peach',icon:'spark'},
 {title:'拼出 Transformer',sub:'从单个模块到完整架构',ids:[6,7],color:'mint',icon:'box'},
 {title:'从理解到实现',sub:'训练、生成，再亲手验证',ids:[8,9],color:'blue',icon:'code'}
];
export const lessons = [
{id:0,title:'先备好数学工具',en:'The small math toolkit',time:15,tag:'向量 · 矩阵 · Softmax',lab:'attention',goal:'能判断矩阵形状，并把一组分数转为概率。',sections:[
['把向量看成一组特征','向量是按顺序排列的数字。比如用 [1, 2] 描述一个对象的两个特征。点积把对应分量相乘再求和：[1, 2] · [3, 4] = 11。它会同时受方向和长度影响，所以“点积越大”不能简单等同于“语义越相似”。模型会通过训练学出适合任务的特征。'],
['形状就是计算的接口','一个 n×d 矩阵可以表示 n 个 token，每个 token 有 d 个特征。矩阵乘法 (n×d) @ (d×m) 得到 n×m；中间维度必须相等。转置把行与列互换。以后看到 QKᵀ，先检查形状，比先背公式更有帮助。'],
['Softmax：把相对分数变成权重','对每个分数 sᵢ，计算 exp(sᵢ) / Σexp(sⱼ)。结果非负，总和为 1。相同的分数得到相同权重。实际计算常先减去最大分数以避免溢出；这不改变结果。注意力里沿每一个 query 对应的 key 维度归一化，不是对整个矩阵归一化。'],
['亲手核对一个例子','分数 [0, ln(3)] 的指数是 [1, 3]，权重就是 [0.25, 0.75]。如果两个 value 分别是 [2, 0] 和 [0, 4]，加权和为 [0.5, 3]。这已经包含了注意力的最后一步。去实验室观察分数变化如何改变信息混合。']],formula:'softmax(s)ᵢ = exp(sᵢ − max(s)) / Σⱼ exp(sⱼ − max(s))',trap:'Softmax 不会选出唯一一个最大值；它通常给所有可见位置分配非零权重。',checks:[['形状 (3, 4) 的矩阵乘以 (4, 2)，输出是什么？',['(3, 2)','(4, 4)','(3, 4)'],0,'保留左矩阵的行数和右矩阵的列数，中间的 4 被求和消去。'],['两个完全相等的分数经过 softmax，第一个权重是多少？',null,0.5,'exp(s) / (exp(s)+exp(s)) = 0.5。'],['把一行分数都加上 100，softmax 会怎样？',['不变','更集中','变为均匀'],0,'分子分母都有 exp(100)，相互抵消。']]},
{id:1,title:'文字怎样变成向量',en:'Tokens & embeddings',time:18,tag:'Token · ID · Embedding',lab:'shape',goal:'区分 token、token ID 和 embedding，追踪输入张量。',sections:[
['先切分，再查表','模型并不直接接收汉字或单词，而是接收 token ID 序列。分词器可按字符、字节或子词切分；一个词可能占多个 token。中文也不保证一个汉字正好等于一个 token。本站用手工 token 做小实验，目的是解释计算，不模拟某个实际分词器。'],
['ID 不是语义坐标','ID 只是词表中的索引。ID 100 和 101 并不比 100 和 900 在语义上更近。Embedding 是一个可训练的查找表 E，形状为词表大小 V × 隐藏维度 d。输入 ID = [7, 2, 9]，就是取出 E 的第 7、2、9 行，形成 3×d 矩阵。'],
['静态词向量与上下文表示','同一个 token ID 查表得到相同的初始向量。但进入 Transformer 后，表示会结合当前位置的上下文而变化。“苹果很好吃”和“苹果发布电脑”中的“苹果”，可以获得不同的上下文表示。向量通常是分布式表示，不应假设某一个维度永远代表某个可读概念。'],
['把 batch 也算进去','同时处理 B 条长度为 T 的序列，ID 张量是 (B, T)，嵌入后是 (B, T, d)。长短不同的序列常用 padding 对齐，并配合 padding mask。padding mask 与禁止看未来的 causal mask 解决的是不同问题。']],formula:'token IDs [B, T] → E[IDs] [B, T, d_model]',trap:'Embedding 查表的输出还不是最终的上下文语义表示。',checks:[['词表大小 1000，隐藏维度 64，embedding 参数量是多少？',null,64000,'每个词表项有 64 个可训练数：1000×64。'],['相同 token 在不同句子中，最初查表得到的向量通常怎样？',['相同，后续上下文表示可不同','必然不同','由 ID 的大小决定'],0,'同一张 embedding 表中，同一 ID 取同一行。'],['Padding mask 的主要作用是？',['排除补齐位置','禁止看未来','随机删词'],0,'补齐符号不应作为有效上下文参与聚合。']]},
{id:2,title:'让模型知道先后顺序',en:'Position matters',time:20,tag:'位置编码 · 顺序',lab:'position',goal:'解释为什么要编码位置，并读懂正弦位置编码。',sections:[
['没有位置，顺序信息从哪里来？','“猫追狗”和“狗追猫”包含相同的词，但含义不同。如果不提供位置、也没有顺序相关的 mask，self-attention 对输入的排列具有等变性：交换输入的行，输出的行也相应交换。它本身无法为“第一个”与“第三个”赋予明确的位置含义。'],
['用不同频率标记位置','原论文把正弦与余弦位置编码加到词嵌入上。第 2i 维使用 sin(pos / 10000^(2i/d))，第 2i+1 维使用 cos。不同维度像不同快慢的时钟，共同形成一个位置签名。pos 通常从 0 开始。位置 0 的偶数维是 0，奇数维是 1。'],
['相加为什么不会丢掉所有信息？','词嵌入和位置向量维度相同，所以可以逐元素相加。模型通过后续可学习投影利用这种组合表示；这并不是说它能无损拆出任意两个相加向量。原论文还对输入 embedding 乘以 √d_model。'],
['认清不同位置方案','可学习的绝对位置 embedding、相对位置方法、RoPE 等都是不同方案。RoPE 把与位置相关的旋转作用在 Q/K 上，不是把正弦向量直接加到输入。先在实验室切换位置和维度，理解原始正弦方案，再读现代模型的变体。']],formula:'PE(pos, 2i) = sin(pos / 10000^(2i/d))\nPE(pos, 2i+1) = cos(pos / 10000^(2i/d))',trap:'位置编码提供顺序信号，不会自动保证模型能泛化到任意长的序列。',checks:[['原始正弦位置编码在 pos=0 时，第 0 维是多少？',null,0,'sin(0)=0。第 1 维则为 cos(0)=1。'],['不带位置与顺序 mask 的自注意力，输入行交换后会怎样？',['输出行相应交换','输出完全不变','自动恢复原顺序'],0,'这叫排列等变，不是所有位置输出都不变。'],['RoPE 与原论文的位置编码是同一个操作吗？',['不是，RoPE 旋转 Q/K','是，都直接加在输入上','都替换 token ID'],0,'不同的位置机制要分开理解。']]},
{id:3,title:'Q、K、V 到底是什么',en:'Queries, keys & values',time:22,tag:'线性投影 · 信息检索',lab:'attention',goal:'解释三种投影的作用，并区分 self-attention 与 cross-attention。',sections:[
['一个 token 的三种角色','想象检索资料：query 表示“我想找什么”，key 表示“我能匹配什么”，value 表示“我提供什么内容”。这是理解计算的类比，不意味着每个向量分量能直接译成人话。一个 token 可以同时查询其他 token，也被其他 token 查询。'],
['它们从哪里来？','对输入 X 分别做三个可学习的线性投影：Q=XW_Q、K=XW_K、V=XW_V。三套参数通常不同，随训练更新。不是手工给每个词贴上 Q、K 或 V 标签。在 self-attention 中，三者来自同一条序列的表示；但 Q、K、V 的数值并不相同。'],
['匹配与内容分工','qᵢ 与所有 kⱼ 的点积形成第 i 行分数。归一化后得到权重 aᵢⱼ，再用它们对 vⱼ 加权求和。固定 Q/K、只改变 V，会改变输出内容，却不改变该次 attention 的权重。改变 Q/K 则通常会改变权重。'],
['跨序列的注意力','在 encoder-decoder 的 cross-attention 中，Q 来自 decoder 当前表示，K/V 来自 encoder 输出。若目标长度为 T、源长度为 S，则分数形状是 T×S，可以不是方阵。到实验室点击不同 query，观察它查询同一组 key 时如何得到不同分布。']],formula:'Q = XW_Q    K = XW_K    V = XW_V',trap:'“注意力权重大”只说明当前聚合更偏向该 value，不能单独证明模型决策的因果解释。',checks:[['保持 Q、K 不变，只修改 V，当前注意力权重怎样变化？',['不变','一定增大','必然均匀'],0,'权重由 QKᵀ、缩放和 mask 决定，V 参与最后的加权和。'],['Cross-attention 中 Q 通常来自哪里？',['Decoder 当前表示','Encoder 输出','词表编号'],0,'K/V 则通常来自 encoder 输出。'],['T=3、S=5 的 cross-attention 分数形状是什么？',['3×5','5×5','3×3'],0,'每个目标 query 对每个源 key 计算一次分数。']]},
{id:4,title:'手算一次 Self-Attention',en:'Scaled dot-product attention',time:25,tag:'缩放 · Softmax · 加权求和',lab:'attention',goal:'从 Q/K/V 一步步计算权重与输出，并解释缩放。',sections:[
['第一步：计算全部匹配分数','Q 的形状为 T×d_k，Kᵀ 为 d_k×T，相乘得到 T×T。第 i 行回答“第 i 个 token 应关注哪些位置”。这是序列位置之间的交互，不是特征维度之间的交互。每行分别计算一组权重。'],
['第二步：缩放与遮罩','将分数除以 √d_k。在分量近似独立、零均值、单位方差的假设下，点积方差随 d_k 增大；缩放有助于避免 softmax 过度饱和。不可见位置在 softmax 前加 −∞，从而得到零权重。不要把被遮罩的原始分数设成 0：exp(0) 仍是 1。'],
['第三步：归一化并混合内容','以 q=[1,0]，k₁=[1,0]，k₂=[0,1]，d_k=2 为例，缩放后分数约为 [0.707,0]，softmax 约为 [0.670,0.330]。若 v₁=[2,0]，v₂=[0,4]，输出约为 [1.340,1.321]。输出是 value 的加权和，不是权重本身。'],
['从算例返回张量','矩阵 A=softmax(QKᵀ/√d_k) 的形状为 T×T，乘以形状 T×d_v 的 V 得到 T×d_v。每行权重和应接近 1，因果 mask 上三角权重应为 0。这是实现时最有用的两个不变量。']],formula:'Attention(Q,K,V) = softmax(QKᵀ / √d_k + M)V',trap:'Softmax 必须沿 key 维度做。每行和为 1，并不意味着每列和也为 1。',checks:[['d_k=64，分数应该除以多少？',null,8,'√64=8，不是除以 64。'],['要让未来位置权重为 0，应该在 softmax 前怎样处理？',['将相应分数设为 −∞','将相应分数设为 0','删除整个 query'],0,'exp(−∞)=0；exp(0)=1，所以分数置零并不等于禁止关注。'],['A 是 4×4，V 是 4×6，输出有多少个特征维度？',null,6,'输出为 4×6，特征维度来自 V。']]},
{id:5,title:'为什么需要多个头',en:'Multi-head attention',time:20,tag:'子空间 · 拼接 · 投影',lab:'shape',goal:'能追踪分头、拼接后的维度，理解多头的表达能力。',sections:[
['不同的投影，不同的观察方式','一个头只有一组注意力分布；多个头通过不同投影，可在不同表示子空间聚合信息。可以用“不同观察角度”理解，但不要认定某个头一定负责语法、另一个一定负责语义。头的功能由训练和具体输入共同决定。'],
['分头后形状怎么变？','常见实现设 d_k=d_v=d_model/h。比如 B=2、T=5、d_model=64、h=4，投影后的张量从 (2,5,64) reshape 为 (2,5,4,16)，再 transpose 为 (2,4,5,16)。最后两个维度分别表示序列与每个头的特征。'],
['每个头独立算，再拼回来','每个头产生 (B,T,d_v) 的输出。沿特征维拼接，得到 (B,T,h×d_v)，再乘 W_O 映射回 d_model。注意：不是把 h 个注意力矩阵平均就结束，也不是把序列长度扩大 h 倍。'],
['多头不等于免费提升','固定 d_model 时，增加头数会缩小每头的维度。表达能力、训练行为和实现效率会一起变化。并非头越多效果一定越好。实验室的形状追踪器会检查 d_model 能否被头数整除。']],formula:'MultiHead(X) = Concat(head₁,…,head_h) W_O',trap:'多头共享输入序列，但各头有各自的投影；通常不是重复计算同一个头。',checks:[['d_model=96，h=6，每头维度是多少？',null,16,'96÷6=16。'],['多头结果通常沿哪个维度拼接？',['特征维度','序列长度维度','batch 维度'],0,'拼接恢复 h×d_v 的特征宽度，再用 W_O 混合。'],['固定 d_model，把头数加倍，每头维度怎样变化？',['减半','加倍','不变'],0,'常见等宽分头设置中 d_head=d_model/h。']]},
{id:6,title:'搭起一个完整的 Block',en:'Residual, normalization & FFN',time:25,tag:'残差 · LayerNorm · FFN',lab:'shape',goal:'说明 attention 与 FFN 的分工，并区分 Pre-LN 和 Post-LN。',sections:[
['Attention 只是模块的一部分','注意力负责在位置之间交换信息，前馈网络 FFN 负责在每个位置内部做非线性特征变换。经典 FFN 是两次线性映射，中间带 ReLU：d_model→d_ff→d_model。各位置使用同一套 FFN 权重，却不在 FFN 内部彼此混合。'],
['残差连接为什么要求形状相同？','残差把输入 x 与子层输出 F(x) 相加，形成 x+F(x)。它保留一条直接的信息与梯度通路。两者特征维必须一致，所以多头输出投影和 FFN 的最后投影都回到 d_model。残差并不意味着模型可以不训练。'],
['LayerNorm 在哪里归一化？','对每个 token 的特征维计算均值和方差，再用可学习的缩放 γ 与偏移 β 调整。LayerNorm 不把 batch 内不同样本混在一起。公式分母有 ε，避免数值不稳定；其作用是规范特征尺度，不是把注意力权重变成概率。'],
['原始架构与常见变体','原论文采用 Post-LN：LN(x+Sublayer(x))。许多后续模型采用 Pre-LN：x+Sublayer(LN(x))，并常在堆叠后再做最终归一化。本站实现作业明确使用 Pre-LN；看代码时先认清顺序，避免把两种架构混画成一种。']],formula:'Pre-LN: y = x + MHA(LN(x))\nz = y + FFN(LN(y))',trap:'FFN 的“逐位置”指每个 token 独立处理，不代表每个 token 有不同的参数。',checks:[['经典 FFN 是否在不同 token 之间直接混合信息？',['否，逐位置应用共享网络','是，执行 T×T 混合','只处理首 token'],0,'跨位置交换由 attention 完成。FFN 混合的是每个位置的特征。'],['LayerNorm 通常沿哪个维度计算统计量？',['单个 token 的特征维','整个 batch','词表 ID'],0,'它不会像 BatchNorm 那样依赖 batch 统计量。'],['Pre-LN 的子层顺序是哪一种？',['x + Sublayer(LN(x))','LN(x + Sublayer(x))','LN(x) + x，省略子层'],0,'第二项是 Post-LN。']]},
{id:7,title:'看懂三种架构与 Mask',en:'Encoder, decoder & causality',time:25,tag:'双向 · 因果 · Cross-attention',lab:'attention',goal:'根据任务选择可见范围，解释信息泄漏。',sections:[
['Encoder：整段输入一起理解','编码器的 self-attention 通常允许每个有效位置关注全部有效输入位置，适合构建双向上下文表示。Padding mask 仍然需要排除补齐位置。Encoder-only 模型可以配合掩码语言建模等目标训练，不等同于“无法生成任何输出”。'],
['Decoder-only：只看已经发生的内容','自回归生成要求位置 i 的预测只依赖不晚于 i 的输入，不能提前看到未来答案。常用下三角因果 mask，包含对角线，因为当前位置的输入 token 已经可见，而该位置预测的是下一个 token。训练时仍可并行计算所有位置。'],
['原始 Encoder-decoder','原始 Transformer 同时包含 encoder 和 decoder。Decoder 先做带因果 mask 的 self-attention，再通过 cross-attention 读取 encoder 输出，最后做 FFN。Cross-attention 的 key 来自源句，通常无需对源句施加目标序列的三角 mask，但要处理源端 padding。'],
['检查是否发生答案泄漏','如果训练预测下一个词时允许关注后面的真实词，loss 可能很好看，生成却失败。一个有效测试是：保持前缀不变、只修改未来 token，因果模型前面位置的输出应保持不变（评估模式，关闭 dropout）。在实验室开关 mask，观察上三角如何归零。']],formula:'Mᵢⱼ = 0  if j ≤ i;  −∞ if j > i',trap:'训练时一次处理整段序列，与每个位置都能看到未来，是两个不同概念。',checks:[['因果 attention 中，位置 i 通常可以关注自身吗？',['可以','不可以','仅最后一层可以'],0,'当前位置的输入已知，用于预测下一个 token；因此通常包含对角线。'],['标准自回归训练为什么可以并行计算多个位置？',['目标已知且 mask 阻止泄漏','每个位置允许偷看答案','训练不使用 attention'],0,'矩阵运算同时计算各位置，依赖范围由 mask 控制。'],['Cross-attention 的 K/V 来自哪里？',['Encoder 输出','Decoder 最后的 softmax','随机标签'],0,'Decoder 的 query 读取源序列表示。']]},
{id:8,title:'模型是怎样学会的',en:'Next-token training',time:25,tag:'目标右移 · 交叉熵 · 梯度',lab:'decode',goal:'构造 next-token 训练样本，并区分训练与推理。',sections:[
['构造输入和目标','对 token 序列 [A,B,C,D]，输入是 [A,B,C]，目标是 [B,C,D]。位置 0 看见 A 后预测 B，位置 1 看见 A/B 后预测 C。经最终线性层，把每个位置的 d_model 维表示映射成 V 个词表 logits，形状为 (B,T,V)。'],
['用交叉熵衡量预测','若正确 token 的概率是 p，单个位置的负对数似然为 −ln(p)。p 越接近 1，损失越小；p=0.5 时约为 0.693。对有效位置取平均，padding 位置通常不计入。PyTorch 的 cross_entropy 接收原始 logits，内部包含 log-softmax；不要先手动 softmax 再当 logits 传入。'],
['梯度更新的是参数','一次训练包含前向、计算 loss、反向传播、优化器更新及梯度清零。Embedding、Q/K/V 投影、FFN 等参数都通过目标学习。注意力矩阵是当前输入和参数产生的中间结果，不是训练后永久保存的一张词语关系表。'],
['验证是否真的学会','先让很小的模型过拟合一个小 batch，确认 loss 能下降。再用独立验证集检查泛化，防止训练数据泄漏。验证 loss 低不自动等于事实正确或能推理；目标和评估必须对应。训练过程中的 dropout 与评估模式也要区分。']],formula:'L = −(1/N_valid) Σₜ log p(xₜ₊₁ | x≤ₜ)',trap:'Next-token 训练并不需要逐个调用模型生成 token；teacher forcing 提供真实前缀并用 mask 并行训练。',checks:[['输入 [A,B,C] 对应的 next-token 目标是什么？',['[B,C,D]','[A,B,C]','[D,C,B]'],0,'目标相对完整序列向前错开一个位置。'],['正确 token 概率为 1，单位置负对数似然是多少？',null,0,'−ln(1)=0，这是理想极限。'],['训练时应传给 PyTorch cross_entropy 什么？',['原始 logits','已取 argmax 的 ID','已 softmax 的概率当作 logits'],0,'该接口内部进行 log-softmax；argmax 还会丢失梯度信息。']]},
{id:9,title:'从下一个词到完整生成',en:'Generation & implementation',time:25,tag:'采样 · KV Cache · 验证',lab:'decode',goal:'描述自回归循环，验证一个最小 attention 实现。',sections:[
['生成是一轮接一轮的','把提示词送入模型，取最后一个位置的词表 logits，选出下一个 token，再把它追加到上下文。重复直到遇到结束 token 或达到长度上限。训练可并行，不意味着单条自回归序列能预先一次生成所有未知 token。'],
['从 logits 到选择','Greedy 取最大 logit；温度采样使用 softmax(logits/T)，T>0。较低温度使分布更集中，较高温度更平坦。Top-k 只保留 k 个最高分候选，再归一化。随机采样增加多样性，也可能降低可靠性。本站采样实验使用固定的玩具 logits，不是一个真实语言模型。'],
['KV Cache 缓存什么？','生成时，历史位置的 K/V 在因果模型里可以复用，避免每步重算全部历史投影。每层通常都有自己的缓存。缓存增长占用内存，而且新 query 仍要读取历史 key/value；它不会消除对上下文长度的依赖。'],
['用测试完成理解闭环','实现时检查：输出形状正确；每行权重和为 1；未来位置权重为 0；修改未来 token 不影响先前输出；小 batch 的训练 loss 能下降。标准密集 self-attention 的分数数量随 T² 增长。完成综合作业，把公式、张量与测试连成一条完整解释链。']],formula:'p(next) = softmax(logits_last / T)\ncontext ← context + sampled_token',trap:'更高温度不等于更聪明；它改变采样分布，不改变已训练参数。',checks:[['降低温度（T>0）通常使分布怎样变化？',['更集中于高分候选','更均匀','改变模型参数'],0,'除以更小的 T 放大 logit 差距。'],['标准密集注意力序列长度翻倍，分数元素数变为几倍？',null,4,'T×T 变为 (2T)×(2T)，即 4 倍。'],['KV Cache 主要复用什么？',['历史位置在各层的 K/V','所有未来 token','训练数据原文'],0,'历史 key/value 可复用，新 token 的计算仍需要进行。']]}
];

export const assignments=[
{id:0,title:'用纸笔跑通一次注意力',level:'基础作业',time:'30 分钟',lessons:[0,3,4],brief:'给定 Q=[[1,0],[0,1]]，K=[[1,0],[0,1]]，V=[[2,0],[0,4]]，d_k=2。不使用因果 mask，逐步写出分数、权重和输出。再加上因果 mask 重算。',deliver:'提交计算过程，以及「为什么 mask 必须在 softmax 前施加」的解释。',rubric:['写出 QKᵀ 和缩放后的 2×2 分数','逐行计算 softmax，验证每行和为 1','计算 AV，注明输出形状','解释有无因果 mask 时第一行的差别'],hint:'无 mask 的第一行权重约 [0.670,0.330]；因果 mask 下第一行变为 [1,0]。',solution:'无 mask：S=[[0.7071,0],[0,0.7071]]；A≈[[0.6698,0.3302],[0.3302,0.6698]]；O≈[[1.3395,1.3210],[0.6605,2.6790]]。因果 mask：A 第一行改为 [1,0]，第二行不变，所以 O 第一行为 [2,0]。若只将未来分数设成 0，exp(0)>0，仍会读取未来。'},
{id:1,title:'追踪一个 Transformer Block',level:'架构作业',time:'40 分钟',lessons:[2,5,6,7],brief:'设 B=2，T=8，d_model=64，h=4，d_ff=256。画出 Pre-LN decoder-only block 的数据流，标出每一步形状，并说明 causal mask 应加在哪里。',deliver:'在作业编辑区写出数据流和形状，可用箭头文本，并解释 FFN 与 attention 的分工。',rubric:['Q/K/V 分头后均为 (2,4,8,16)','分数与 mask 的有效广播目标为 (2,4,8,8)','拼接和输出投影后恢复 (2,8,64)','FFN 经过 256 维并回到 64 维，残差形状一致'],hint:'reshape 分头后还需要 transpose；先前的序列维和头维不能混淆。',solution:'X (2,8,64) → LN → Q/K/V 投影 → reshape (2,8,4,16) → transpose (2,4,8,16) → 分数 (2,4,8,8) → 缩放+因果 mask+softmax → AV (2,4,8,16) → transpose+reshape (2,8,64) → W_O → 加 X。再 LN → Linear 64→256 → 激活 → Linear 256→64 → 第二次残差相加。'},
{id:2,title:'实现并测试因果注意力',level:'代码作业',time:'60 分钟',lessons:[4,5,7],brief:'用 Python/PyTorch 实现 scaled_attention(q,k,v,causal=True)。输入形状 (B,h,T,d)，返回输出和权重。先在本地 Python 环境运行，再把代码和验证结果粘贴到这里。本站不执行 Python，也不自动评判代码。',deliver:'代码、测试输出和至少一个曾经发现的错误。',rubric:['使用 √d_k 缩放，沿最后一维 softmax','mask 在 softmax 前用 −∞ 屏蔽未来','断言每行和为 1，上三角为 0','修改未来的 K/V，验证之前位置输出不变'],hint:'torch.ones(T,T,dtype=torch.bool).triu(1) 表示需要屏蔽的未来位置。注意不同 PyTorch API 的布尔 mask 语义可能相反。',solution:'def scaled_attention(q, k, v, causal=True):\n    import math, torch\n    scores = q @ k.transpose(-2, -1) / math.sqrt(q.size(-1))\n    if causal:\n        t, s = scores.shape[-2:]\n        mask = torch.ones(t, s, device=q.device, dtype=torch.bool).triu(1)\n        scores = scores.masked_fill(mask, float("-inf"))\n    weights = scores.softmax(dim=-1)\n    return weights @ v, weights\n\n# 本例假设对齐的完整序列；带 KV Cache 的位置偏移需单独处理。\n# 还应测试梯度、数值稳定性及设备/dtype。'},
{id:3,title:'毕业项目：一个最小语言模型',level:'综合项目',time:'2–4 小时',lessons:[8,9],brief:'在本地实现一个小型字符级 decoder-only Transformer：字符词表 → embedding+位置 → 2 个 Pre-LN block → final LayerNorm → 词表投影。选择一段自己可使用的文本，划分训练/验证集。',deliver:'粘贴代码或实现笔记、训练/验证 loss 记录、一段生成文本，以及对失败案例的分析。',rubric:['正确构造右移一位的输入和目标，不泄漏验证数据','因果 mask、残差、LayerNorm、FFN 与形状正确','能过拟合一个小 batch，并记录独立验证 loss','实现逐步生成，比较两个温度并解释结果'],hint:'先让单 batch 的 loss 稳定下降，再扩展数据。使用 model.eval() 与 torch.no_grad() 生成。',solution:'建议验收顺序：1. 对注意力做形状、归一化、遮罩测试。2. 用单 batch 训练，记录 loss 是否下降。3. 恢复完整训练集，用独立验证集评估。4. 生成时只取最后位置 logits；截断上下文到位置编码支持的长度。5. 固定随机种子比较采样。小模型文本不流畅并不自动代表实现错误，需结合数据规模、参数量和验证指标判断。'}
];

export const pythonStarter=`import math\nimport torch\n\ndef scaled_attention(q, k, v, causal=True):\n    # q, k, v: (batch, heads, tokens, head_dim)\n    scores = q @ k.transpose(-2, -1) / math.sqrt(q.size(-1))\n    if causal:\n        t = q.size(-2)\n        mask = torch.ones(t, t, device=q.device, dtype=torch.bool).triu(1)\n        scores = scores.masked_fill(mask, float('-inf'))\n    weights = scores.softmax(dim=-1)\n    return weights @ v, weights\n\nif __name__ == '__main__':\n    torch.manual_seed(42)\n    q, k, v = [torch.randn(2, 4, 8, 16) for _ in range(3)]\n    out, a = scaled_attention(q, k, v)\n    assert out.shape == (2, 4, 8, 16)\n    assert torch.allclose(a.sum(-1), torch.ones(2, 4, 8))\n    assert torch.all(a.triu(1) == 0)\n    k2, v2 = k.clone(), v.clone()\n    k2[..., 5:, :] += 10\n    v2[..., 5:, :] -= 10\n    out2, _ = scaled_attention(q, k2, v2)\n    assert torch.allclose(out[..., :5, :], out2[..., :5, :])\n    print('All attention checks passed.')\n`;

// Spread the correct option across positions without changing question meaning.
for (const lesson of lessons) {
  lesson.checks.forEach((q, i) => {
    if (!q[1]) return;
    const shift = (lesson.id + i + 1) % q[1].length;
    const original = q[1];
    q[1] = original.map((_, j) => original[(j - shift + original.length) % original.length]);
    q[2] = (q[2] + shift) % original.length;
  });
}

// Preserve lesson IDs and answer ordering so existing progress stays compatible.
for (const lesson of lessons) Object.assign(lesson, expandedLessons[lesson.id]);

// Mathematical assignment prose is authored as LaTeX; code remains literal Python.
assignments[0].preview='给定两组小矩阵，逐步算出匹配分数、注意力权重和输出，再用因果遮罩重算。';
assignments[0].brief=String.raw`给定下列投影后的矩阵，先不使用因果 mask，逐步写出匹配分数、缩放分数、权重和输出。然后加入因果 mask 再计算一次。
\[Q=K=\begin{bmatrix}1&0\\0&1\end{bmatrix},\qquad V=\begin{bmatrix}2&0\\0&4\end{bmatrix},\qquad d_k=2\]`;
assignments[0].solution=String.raw`无 mask 时：
\[S\approx\begin{bmatrix}0.7071&0\\0&0.7071\end{bmatrix}\]
\[A\approx\begin{bmatrix}0.6698&0.3302\\0.3302&0.6698\end{bmatrix},\qquad O\approx\begin{bmatrix}1.3395&1.3210\\0.6605&2.6790\end{bmatrix}\]
加入因果 mask 后，第一行只允许读取第一个位置：
\[A_{\mathrm{causal}}\approx\begin{bmatrix}1&0\\0.3302&0.6698\end{bmatrix}\]
\[O_{\mathrm{causal}}\approx\begin{bmatrix}2&0\\0.6605&2.6790\end{bmatrix}\]
若只将未来分数设成零，因为 \(e^0=1\)，仍会给未来分配非零权重。显示值经四舍五入，末位允许有微小差异。`;
assignments[1].preview='用给定的模型配置，追踪一个 Pre-LN decoder-only block，标出每个中间张量的形状。';
assignments[1].brief=String.raw`设 \(B=2\)、\(T=8\)、\(d_{\mathrm{model}}=64\)、\(h=4\)、\(d_{\mathrm{ff}}=256\)。画出 Pre-LN decoder-only block 的数据流，标出每一步形状，并说明 causal mask 加在哪里。`;
assignments[1].solution=String.raw`第一条残差分支：
\[\begin{aligned}X&:(2,8,64)\\Q,K,V\ \text{(split)}&:(2,4,8,16)\\S,A&:(2,4,8,8)\\AV&:(2,4,8,16)\\\operatorname{Concat}(\mathrm{heads})W_O&:(2,8,64)\end{aligned}\]
执行顺序为 LN → 投影 → 分头与换轴 → 分数缩放、因果 mask、softmax → 乘 V → 换轴并拼接 → 输出投影 → 加回 X。
第二条残差分支：
\[(2,8,64)\xrightarrow{\mathrm{LN}}(2,8,64)\]
\[(2,8,64)\xrightarrow{W_1,\ \sigma}(2,8,256)\xrightarrow{W_2}(2,8,64)\]
最后加回这一分支的输入，保持输出形状为 \((2,8,64)\)。`;
