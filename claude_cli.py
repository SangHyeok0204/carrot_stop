# -*- coding: utf-8 -*-
"""
Claude CLI with MCP-like Features
VSCode 터미널에서 Claude를 사용할 수 있는 CLI 도구
"""

import os
import sys
import json
import requests
from pathlib import Path

class ClaudeCLI:
    def __init__(self, api_key, workspace_path):
        self.api_key = api_key
        self.workspace = Path(workspace_path)
        self.api_url = "https://api.anthropic.com/v1/messages"
        self.model = "claude-3-5-sonnet-20241022"
        self.conversation_history = []
        
    def read_file(self, file_path):
        """로컬 파일 읽기 (MCP filesystem 기능)"""
        try:
            full_path = self.workspace / file_path
            if not full_path.exists():
                return f"❌ 파일을 찾을 수 없습니다: {file_path}"
            
            with open(str(full_path), 'r', encoding='utf-8') as f:
                content = f.read()
            return f"📄 파일: {file_path}\n\n{content}"
        except Exception as e:
            return f"❌ 파일 읽기 오류: {e}"
    
    def list_files(self, directory="."):
        """디렉토리 파일 목록 (MCP filesystem 기능)"""
        try:
            dir_path = self.workspace / directory
            if not dir_path.exists():
                return f"❌ 디렉토리를 찾을 수 없습니다: {directory}"
            
            files = []
            for item in dir_path.rglob('*'):
                if item.is_file():
                    # node_modules, .git 등 제외
                    if 'node_modules' not in str(item) and '.git' not in str(item):
                        rel_path = item.relative_to(self.workspace)
                        files.append(str(rel_path))
            
            return files[:50]  # 최대 50개만
        except Exception as e:
            return f"❌ 디렉토리 목록 오류: {e}"
    
    def search_files(self, pattern):
        """파일 이름으로 검색"""
        try:
            files = []
            for item in self.workspace.rglob(f"*{pattern}*"):
                if item.is_file() and 'node_modules' not in str(item):
                    files.append(str(item.relative_to(self.workspace)))
            return files[:20]
        except Exception as e:
            return f"❌ 검색 오류: {e}"
    
    def call_claude_api(self, user_message):
        """Claude API 호출"""
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        
        messages = self.conversation_history + [
            {"role": "user", "content": user_message}
        ]
        
        data = {
            "model": self.model,
            "max_tokens": 4096,
            "messages": messages
        }
        
        try:
            response = requests.post(self.api_url, headers=headers, json=data)
            response.raise_for_status()
            result = response.json()
            
            assistant_message = result['content'][0]['text']
            
            # 대화 기록 저장
            self.conversation_history.append({"role": "user", "content": user_message})
            self.conversation_history.append({"role": "assistant", "content": assistant_message})
            
            # 대화 기록이 너무 길면 최근 것만 유지
            if len(self.conversation_history) > 10:
                self.conversation_history = self.conversation_history[-10:]
            
            return assistant_message
        
        except requests.exceptions.HTTPError as e:
            if response.status_code == 401:
                return "❌ API 키가 유효하지 않습니다. 환경 변수를 확인해주세요."
            elif response.status_code == 429:
                return "❌ API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요."
            else:
                return f"❌ API 오류: {e}"
        except Exception as e:
            return f"❌ 오류: {e}"
    
    def chat(self, user_input):
        """파일 컨텍스트와 함께 채팅"""
        # @read 명령어 처리
        if user_input.startswith('@read '):
            file_path = user_input[6:].strip()
            return self.read_file(file_path)
        
        # @list 명령어 처리
        elif user_input.startswith('@list'):
            directory = user_input[5:].strip() or "."
            files = self.list_files(directory)
            if isinstance(files, list):
                result = f"📁 디렉토리: {directory}\n\n"
                for f in files:
                    result += f"  - {f}\n"
                if len(files) == 50:
                    result += "\n(최대 50개까지만 표시됩니다)"
                return result
            return files
        
        # @search 명령어 처리
        elif user_input.startswith('@search '):
            pattern = user_input[8:].strip()
            files = self.search_files(pattern)
            if isinstance(files, list):
                result = f"🔍 검색 결과: '{pattern}'\n\n"
                for f in files:
                    result += f"  - {f}\n"
                if not files:
                    result += "검색 결과가 없습니다."
                return result
            return files
        
        # @file 명령어 처리 (파일과 함께 질문)
        elif user_input.startswith('@file '):
            parts = user_input[6:].split(maxsplit=1)
            if len(parts) < 2:
                return "❌ 사용법: @file <파일경로> <질문>"
            
            file_path, question = parts
            file_content = self.read_file(file_path)
            
            if "❌" in file_content:
                return file_content
            
            full_message = f"{file_content}\n\n질문: {question}"
            return self.call_claude_api(full_message)
        
        # @clear 명령어 (대화 기록 초기화)
        elif user_input == '@clear':
            self.conversation_history = []
            return "✅ 대화 기록이 초기화되었습니다."
        
        # 일반 채팅
        else:
            return self.call_claude_api(user_input)

def print_welcome():
    """환영 메시지"""
    print("=" * 60)
    print("🤖 Claude CLI with MCP Features")
    print("=" * 60)
    print("\n사용 가능한 명령어:")
    print("  @read <파일경로>           - 파일 내용 읽기")
    print("  @list [디렉토리]           - 파일 목록 보기")
    print("  @search <검색어>           - 파일 이름 검색")
    print("  @file <파일경로> <질문>    - 파일과 함께 질문하기")
    print("  @clear                     - 대화 기록 초기화")
    print("  quit / exit                - 종료")
    print("\n일반 대화:")
    print("  그냥 메시지를 입력하면 Claude와 대화할 수 있습니다.")
    print("  대화 기록이 자동으로 유지됩니다.\n")
    print("=" * 60)

def main():
    # API 키 확인
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("❌ 오류: ANTHROPIC_API_KEY 환경 변수가 설정되지 않았습니다.")
        print("\n설정 방법:")
        print("  PowerShell: $env:ANTHROPIC_API_KEY = \"your-api-key\"")
        print("  CMD:        set ANTHROPIC_API_KEY=your-api-key")
        print("\nAPI 키 발급: https://console.anthropic.com/")
        sys.exit(1)
    
    # 워크스페이스 경로 (현재 디렉토리)
    workspace = os.getcwd()
    
    print_welcome()
    print(f"📂 작업 디렉토리: {workspace}\n")
    
    cli = ClaudeCLI(api_key, workspace)
    
    # 메인 루프
    while True:
        try:
            # Python 3.6 호환을 위해 input 사용
            user_input = input("\n💬 You: ").strip()
            
            if not user_input:
                continue
            
            if user_input.lower() in ['quit', 'exit', 'q']:
                print("\n👋 안녕히 가세요!")
                break
            
            # Claude 응답
            print("\n🤖 Claude: ", end="")
            response = cli.chat(user_input)
            print(response)
        
        except KeyboardInterrupt:
            print("\n\n👋 안녕히 가세요!")
            break
        except Exception as e:
            print(f"\n❌ 오류: {e}")

if __name__ == "__main__":
    main()

