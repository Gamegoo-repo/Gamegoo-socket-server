class TreeNode {
  constructor(memberId, priorityValue) {
    this.memberId = memberId;
    this.priorityValue = priorityValue;
    this.left = null;
    this.right = null;
  }
}

// BST 구현
class PriorityTree {
  constructor() {
    this.root = null;
  }

  // 새로운 노드를 트리에 삽입
  insert(memberId, priorityValue) {

    const newNode = new TreeNode(memberId, priorityValue);
    if (this.root === null) {
      this.root = newNode;
    } else {
      this.insertNode(this.root, newNode);
    }
  }

  // Node 삽입 로직
  insertNode(node, newNode) {
    if (newNode.priorityValue < node.priorityValue) {
      if (node.left === null) {
        node.left = newNode;
      } else {
        this.insertNode(node.left, newNode);
      }
    } else {
      if (node.right === null) {
        node.right = newNode;
      } else {
        this.insertNode(node.right, newNode);
      }
    }
  }

  // 트리 내 가장 priority가 높은 Node 찾기
  getMax(node) {
    if (node === null) {
      return null;
    }

    if (node.right !== null) {
      node = this.getMax(node.right);
    }
    return node;
  }

  // 트리 내에서 ExceptNode의 우선순위 값보다 작지만 가장 priority가 큰 노드 찾기
  getMaxBeforeNode(node, ExceptNode) {
    if (node === null) {
      return null;
    }
    if (node.right !== null && node !== ExceptNode) {
      node = this.getMax(node.right);
    }
    return node;
  }


  // 중위 순회로 정렬된 리스트를 반환
  inOrderTraverse(node, result = []) {
    if (node !== null) {
      this.inOrderTraverse(node.left, result);
      result.push({ memberId: node.memberId, priorityValue: node.priorityValue });
      this.inOrderTraverse(node.right, result);
    }
    return result;
  }

  // 트리의 정렬된 리스트를 반환
  getSortedList() {
    return this.inOrderTraverse(this.root);
  }

  // 특정 memberId가 트리에 존재하는지 확인
  contains(memberId) {
    return this.inOrderContains(this.root, memberId);
  }

  // 중위 순회로 특정 memberId가 있는지 확인하는 메서드
  inOrderContains(node, memberId) {
    if (node === null) {
      return false; // 노드가 없으면 false 반환
    }

    // 왼쪽 자식 노드 탐색
    if (this.inOrderContains(node.left, memberId)) {
      return true;
    }

    // 현재 노드가 찾는 memberId인지 확인
    if (node.memberId === memberId) {
      return true;
    }

    // 오른쪽 자식 노드 탐색
    return this.inOrderContains(node.right, memberId);
  }


}

// PriorityTree.js
module.exports = {
  PriorityTree
};
