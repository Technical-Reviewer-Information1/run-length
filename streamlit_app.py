import streamlit as st
import plotly.graph_objects as go
import plotly.express as px
import numpy as np
import pandas as pd

st.set_page_config(page_title="データの圧縮②ランレングス法", page_icon="🔢", layout="wide")

st.title("データの圧縮②ランレングス法")
st.caption("Created by Dit-Lab.(Daiki ITO)")
st.caption("Supported by Tomoaki ATSUMI")

st.markdown("---")

# Initialize session state
if 'grid' not in st.session_state:
    st.session_state.grid = np.zeros((5, 5), dtype=int)
if 'step' not in st.session_state:
    st.session_state.step = 0

def create_grid_visualization(grid, title="ドット絵", show_values=False):
    """Create a Plotly heatmap for the grid"""
    fig = go.Figure(data=go.Heatmap(
        z=grid,
        colorscale=[[0, 'black'], [1, 'white']],
        showscale=False,
        xgap=2,
        ygap=2
    ))
    
    # Add text annotations if requested
    if show_values:
        for i in range(5):
            for j in range(5):
                fig.add_annotation(
                    x=j, y=i,
                    text=str(grid[i][j]),
                    showarrow=False,
                    font=dict(color="red" if grid[i][j] == 0 else "blue", size=16)
                )
    
    fig.update_layout(
        title=title,
        width=400,
        height=400,
        xaxis=dict(showticklabels=False, showgrid=False),
        yaxis=dict(showticklabels=False, showgrid=False, autorange='reversed')
    )
    
    return fig

# Grid creation section
st.header("1. ドット絵の作成")
st.write("5×5のグリッドで白黒のドット絵を作成してください。クリックで色を切り替えます。")

col1, col2 = st.columns([1, 1])

with col1:
    # Create interactive grid using buttons
    grid_changed = False
    
    for i in range(5):
        cols = st.columns(5)
        for j in range(5):
            with cols[j]:
                button_key = f"btn_{i}_{j}"
                color = "⬜" if st.session_state.grid[i][j] == 1 else "⬛"
                if st.button(color, key=button_key, use_container_width=True):
                    st.session_state.grid[i][j] = 1 - st.session_state.grid[i][j]
                    grid_changed = True

with col2:
    # Display grid visualization
    fig = create_grid_visualization(st.session_state.grid)
    st.plotly_chart(fig, use_container_width=True)

# Reset button
if st.button("グリッドをリセット", type="secondary"):
    st.session_state.grid = np.zeros((5, 5), dtype=int)
    st.session_state.step = 0
    st.rerun()

st.markdown("---")

# Run-length encoding section
st.header("2. ランレングス法の実行")

if st.button("圧縮実行", type="primary", disabled=np.all(st.session_state.grid == 0)):
    st.session_state.step = 1

if st.session_state.step > 0:
    # Step 1: Data reading
    st.subheader("ステップ1：データの読み取り")
    st.write("作成したドット絵を左上から右下へ順番に読み取ります。")
    
    # Flatten the grid (row by row)
    flattened_data = st.session_state.grid.flatten()
    
    col1, col2 = st.columns([1, 1])
    
    with col1:
        # Show grid with reading order
        fig_reading = create_grid_visualization(st.session_state.grid, "読み取り順序", show_values=True)
        
        # Add reading order annotations
        for i in range(5):
            for j in range(5):
                order = i * 5 + j + 1
                fig_reading.add_annotation(
                    x=j, y=i,
                    text=str(order),
                    showarrow=False,
                    font=dict(color="orange", size=10),
                    yshift=15
                )
        
        st.plotly_chart(fig_reading, use_container_width=True)
    
    with col2:
        st.write("**読み取った2進数データ：**")
        data_str = " → ".join([str(x) for x in flattened_data])
        st.code(data_str)
        
        # Show as list
        st.write("**リスト形式：**")
        st.code(f"[{', '.join([str(x) for x in flattened_data])}]")

if st.session_state.step > 0:
    st.markdown("---")
    
    # Step 2: Run-length encoding
    st.subheader("ステップ2：連続数のカウント")
    st.write("同じデータが連続する回数をカウントします。")
    
    # Perform run-length encoding
    def run_length_encode(data):
        if len(data) == 0:
            return []
        
        encoded = []
        current_value = data[0]
        count = 1
        
        for i in range(1, len(data)):
            if data[i] == current_value:
                count += 1
            else:
                encoded.append((current_value, count))
                current_value = data[i]
                count = 1
        
        encoded.append((current_value, count))
        return encoded
    
    encoded_data = run_length_encode(flattened_data)
    
    col1, col2 = st.columns([1, 1])
    
    with col1:
        st.write("**エンコード結果：**")
        for i, (value, count) in enumerate(encoded_data):
            color_name = "白" if value == 1 else "黒"
            st.write(f"{i+1}. {color_name}が{count}回 → ({value}, {count})")
    
    with col2:
        # Visualization of encoding process
        df_encoding = pd.DataFrame({
            'セグメント': [f'{i+1}' for i in range(len(encoded_data))],
            '色': ['白' if x[0] == 1 else '黒' for x in encoded_data],
            '連続回数': [x[1] for x in encoded_data]
        })
        
        fig_bar = px.bar(df_encoding, x='セグメント', y='連続回数', 
                        color='色', color_discrete_map={'白': 'lightgray', '黒': 'black'},
                        title="連続回数の可視化")
        fig_bar.update_layout(height=400)
        st.plotly_chart(fig_bar, use_container_width=True)

if st.session_state.step > 0:
    st.markdown("---")
    
    # Step 3: Data comparison
    st.subheader("ステップ3：データ量の比較")
    
    original_bits = 25  # 5x5 grid
    # Each pair needs bits for value and count
    # Assuming 1 bit for value (0 or 1) and variable bits for count
    compressed_pairs = len(encoded_data)
    
    # Calculate bits needed for count (log2 of max possible count)
    max_count = max([count for _, count in encoded_data]) if encoded_data else 1
    count_bits = max(1, int(np.ceil(np.log2(max_count + 1))))
    
    compressed_bits = compressed_pairs * (1 + count_bits)  # 1 bit for value + count_bits for count
    
    compression_ratio = (1 - compressed_bits / original_bits) * 100
    
    col1, col2, col3 = st.columns([1, 1, 1])
    
    with col1:
        st.metric("元のデータ量", f"{original_bits}ビット", help="5×5 = 25ピクセル")
    
    with col2:
        st.metric("圧縮後のデータ量", f"{compressed_bits}ビット", 
                 help=f"({compressed_pairs}ペア × {1 + count_bits}ビット/ペア)")
    
    with col3:
        st.metric("圧縮率", f"{compression_ratio:.1f}%", 
                 help="正の値は圧縮効果あり、負の値は逆に増加")
    
    # Visualization of compression
    fig_comparison = go.Figure(data=[
        go.Bar(name='元のデータ', x=['データ量'], y=[original_bits], marker_color='lightcoral'),
        go.Bar(name='圧縮後', x=['データ量'], y=[compressed_bits], marker_color='lightblue')
    ])
    
    fig_comparison.update_layout(
        title="データ量の比較",
        yaxis_title="ビット数",
        barmode='group',
        height=400
    )
    
    st.plotly_chart(fig_comparison, use_container_width=True)

# Summary section
st.markdown("---")
st.header("3. まとめと考察")

col1, col2 = st.columns([1, 1])

with col1:
    st.subheader("🎯 ランレングス法の得意なこと")
    st.write("""
    - **同じデータが連続する画像**に非常に効果的
    - イラスト、アイコン、ロゴなどのシンプルな画像
    - 広い単色領域を持つ画像
    - 白黒画像やパレット画像
    """)

with col2:
    st.subheader("⚠️ ランレングス法の苦手なこと")
    st.write("""
    - **複雑で色の変化が激しい画像**には不向き
    - 写真のような自然画像
    - ノイズの多い画像
    - 細かいパターンが多い画像
    """)

st.info("""
💡 **重要なポイント**: 
圧縮方法には向き不向きがあります。ランレングス法は「同じ情報の連続をまとめる」というシンプルなルールで、
適切な画像に使えば大きな圧縮効果を得られますが、不適切な画像では逆にデータ量が増えてしまうこともあります。
""")

# Example patterns
st.subheader("🔍 パターンの実験")
st.write("異なるパターンを試して、圧縮率の違いを体験してみましょう！")

pattern_col1, pattern_col2, pattern_col3 = st.columns([1, 1, 1])

with pattern_col1:
    if st.button("全て白のパターン", use_container_width=True):
        st.session_state.grid = np.ones((5, 5), dtype=int)
        st.session_state.step = 0
        st.rerun()

with pattern_col2:
    if st.button("チェッカーパターン", use_container_width=True):
        checker = np.zeros((5, 5), dtype=int)
        for i in range(5):
            for j in range(5):
                checker[i][j] = (i + j) % 2
        st.session_state.grid = checker
        st.session_state.step = 0
        st.rerun()

with pattern_col3:
    if st.button("ストライプパターン", use_container_width=True):
        stripe = np.zeros((5, 5), dtype=int)
        stripe[:, ::2] = 1  # Every other column is white
        st.session_state.grid = stripe
        st.session_state.step = 0
        st.rerun()