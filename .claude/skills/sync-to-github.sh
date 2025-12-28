#!/usr/bin/env bash
#
# sync-to-github.sh - Sync skills directory to GitHub repository
#
# Usage: ./sync-to-github.sh [options]
#
# Options:
#   -r, --repo URL      GitHub repository URL (default: https://github.com/julianobarbosa/claude-code-skills.git)
#   -b, --branch NAME   Branch to push to (default: main)
#   -m, --message MSG   Custom commit message
#   -d, --dry-run       Show what would be done without making changes
#   -h, --help          Show this help message
#

set -euo pipefail

# Default configuration
GITHUB_REPO="${GITHUB_REPO:-https://github.com/julianobarbosa/claude-code-skills.git}"
BRANCH="${BRANCH:-main}"
TEMP_DIR="/tmp/claude-code-skills-sync"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DRY_RUN=false
CUSTOM_MESSAGE=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# Show help
show_help() {
    head -20 "$0" | tail -15 | sed 's/^#//' | sed 's/^ //'
    exit 0
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -r|--repo)
                GITHUB_REPO="$2"
                shift 2
                ;;
            -b|--branch)
                BRANCH="$2"
                shift 2
                ;;
            -m|--message)
                CUSTOM_MESSAGE="$2"
                shift 2
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -h|--help)
                show_help
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                ;;
        esac
    done
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    if ! command -v git &> /dev/null; then
        log_error "git is not installed"
        exit 1
    fi

    if ! command -v rsync &> /dev/null; then
        log_error "rsync is not installed"
        exit 1
    fi

    log_success "All prerequisites met"
}

# Clone the target repository
clone_repo() {
    log_info "Cloning repository: $GITHUB_REPO"

    if [[ -d "$TEMP_DIR" ]]; then
        log_warn "Removing existing temp directory: $TEMP_DIR"
        rm -rf "$TEMP_DIR"
    fi

    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY-RUN] Would clone $GITHUB_REPO to $TEMP_DIR"
        return
    fi

    git clone --depth 1 --branch "$BRANCH" "$GITHUB_REPO" "$TEMP_DIR" 2>&1
    log_success "Repository cloned successfully"
}

# Sync skills files
sync_files() {
    log_info "Syncing skills from: $SCRIPT_DIR"

    local exclude_patterns=(
        --exclude='logs'
        --exclude='.DS_Store'
        --exclude='*.pyc'
        --exclude='__pycache__'
        --exclude='sync-to-github.sh'
        --exclude='.git'
    )

    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY-RUN] Would sync files with rsync:"
        rsync -avn "${exclude_patterns[@]}" "$SCRIPT_DIR/" "$TEMP_DIR/skills/" 2>/dev/null || true
        return
    fi

    rsync -av "${exclude_patterns[@]}" "$SCRIPT_DIR/" "$TEMP_DIR/skills/"
    log_success "Files synced successfully"
}

# Generate commit message
generate_commit_message() {
    if [[ -n "$CUSTOM_MESSAGE" ]]; then
        echo "$CUSTOM_MESSAGE"
        return
    fi

    cd "$TEMP_DIR"

    local new_skills=()
    local modified_skills=()

    # Get new skills (untracked directories)
    while IFS= read -r line; do
        if [[ "$line" =~ ^skills/([^/]+)/ ]]; then
            local skill="${BASH_REMATCH[1]}"
            if [[ ! " ${new_skills[*]} " =~ " ${skill} " ]]; then
                new_skills+=("$skill")
            fi
        fi
    done < <(git status --porcelain | grep '^??' | awk '{print $2}')

    # Get modified skills
    while IFS= read -r line; do
        if [[ "$line" =~ skills/([^/]+)/ ]]; then
            local skill="${BASH_REMATCH[1]}"
            if [[ ! " ${modified_skills[*]} " =~ " ${skill} " ]] && \
               [[ ! " ${new_skills[*]} " =~ " ${skill} " ]]; then
                modified_skills+=("$skill")
            fi
        fi
    done < <(git status --porcelain | grep -E '^[ M]M' | awk '{print $2}')

    # Build commit message
    local msg="feat(skills): sync skills from source repository"
    local body=""

    if [[ ${#new_skills[@]} -gt 0 ]]; then
        body+="\n\nNew skills added:"
        for skill in "${new_skills[@]}"; do
            body+="\n- $skill"
        done
    fi

    if [[ ${#modified_skills[@]} -gt 0 ]]; then
        body+="\n\nModified skills:"
        for skill in "${modified_skills[@]}"; do
            body+="\n- $skill"
        done
    fi

    body+="\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)"
    body+="\n\nCo-Authored-By: Claude <noreply@anthropic.com>"

    echo -e "${msg}${body}"
}

# Commit and push changes
commit_and_push() {
    cd "$TEMP_DIR"

    # Check if there are changes
    if git diff --quiet && git diff --staged --quiet && [[ -z "$(git status --porcelain)" ]]; then
        log_info "No changes to commit - repository is already up to date"
        return 0
    fi

    log_info "Staging changes..."

    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY-RUN] Would stage and commit these changes:"
        git status --short
        return
    fi

    git add -A

    local commit_msg
    commit_msg=$(generate_commit_message)

    log_info "Committing changes..."
    git commit -m "$commit_msg"

    log_info "Pushing to $BRANCH..."
    git push origin "$BRANCH"

    log_success "Changes pushed successfully"
}

# Cleanup
cleanup() {
    if [[ -d "$TEMP_DIR" ]] && [[ "$DRY_RUN" != true ]]; then
        log_info "Cleaning up temp directory..."
        rm -rf "$TEMP_DIR"
    fi
}

# Main function
main() {
    parse_args "$@"

    echo ""
    echo "=========================================="
    echo "  Skills Sync to GitHub"
    echo "=========================================="
    echo ""
    echo "  Repository: $GITHUB_REPO"
    echo "  Branch:     $BRANCH"
    echo "  Source:     $SCRIPT_DIR"
    echo "  Dry Run:    $DRY_RUN"
    echo ""
    echo "=========================================="
    echo ""

    check_prerequisites
    clone_repo

    if [[ "$DRY_RUN" != true ]]; then
        sync_files
        commit_and_push
        cleanup
    else
        sync_files
        log_info "[DRY-RUN] Complete - no changes made"
    fi

    echo ""
    log_success "Sync completed!"
    echo ""
}

# Run main function
main "$@"
